// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { BadRequestError } from 'errors/BadRequestError'
import type { NextApiRequest, NextApiResponse } from 'next'
import withErrorHandler from 'utils/errorHandler'
import Cors from 'cors'
import { runMiddleware } from 'utils/runMiddleware'
import { getToken } from 'next-auth/jwt'
import _ from 'lodash'
import { createApi, SearchOrderBy } from 'unsplash-js';

// TypeScript interfaces for Unsplash API response
interface UnsplashUser {
    id: string;
    username: string;
    name: string;
    first_name: string;
    last_name: string | null;
}

interface UnsplashUrls {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
}

interface UnsplashLinks {
    self: string;
    html: string;
    download: string;
}

interface UnsplashPhoto {
    id: string;
    created_at: string;
    width: number;
    height: number;
    color: string;
    blur_hash: string;
    description: string;
    user: UnsplashUser;
    urls: UnsplashUrls;
    links: UnsplashLinks;
}

interface UnsplashPhotosResponse {
    total: number;
    total_pages: number;
    results: UnsplashPhoto[];
}

const cors = Cors({
    methods: ['GET'],
    origin: 'https://chunithm-net-eng.com',
})

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<UnsplashPhotosResponse | null>
) {
    await runMiddleware(req, res, cors)

    const unsplash = createApi({
        accessKey: process.env.UNSPLASH_ACCESS_KEY ?? "",
    });

    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const query = req.query.query ? req.query.query as string : 'famous place';
    const orderBy = req.query.sort ? req.query.sort as SearchOrderBy : "relevant";

    const result = await unsplash.search.getPhotos({
        query: query,
        perPage: 20,
        page: page,
        orderBy : orderBy,
    });
    if (result.type === 'error') {
        throw new BadRequestError('Failed to fetch photos from Unsplash');
    }

    // Transform the response to match our custom interface
    const transformedResponse: UnsplashPhotosResponse = {
        total: result.response.total,
        total_pages: result.response.total_pages,
        results: result.response.results.map(photo => ({
            id: photo.id,
            created_at: photo.created_at,
            width: photo.width,
            height: photo.height,
            color: photo.color || '#000000',
            blur_hash: photo.blur_hash || '',
            description: photo.description || '',
            user: {
                id: photo.user.id,
                username: photo.user.username,
                name: photo.user.name,
                first_name: photo.user.first_name,
                last_name: photo.user.last_name || null,
            },
            urls: {
                raw: photo.urls.raw,
                full: photo.urls.full,
                regular: photo.urls.regular,
                small: photo.urls.small,
                thumb: photo.urls.thumb,
            },
            links: {
                self: photo.links.self,
                html: photo.links.html,
                download: photo.links.download,
            },
        }))
    };

    res.status(200).json(transformedResponse)
}

export default withErrorHandler(handler)
