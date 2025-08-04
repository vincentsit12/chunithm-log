// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { BadRequestError } from 'errors/BadRequestError'
import type { NextApiRequest, NextApiResponse } from 'next'
import withErrorHandler from 'utils/errorHandler'
import Cors from 'cors'
import { runMiddleware } from 'utils/runMiddleware'
import { getToken } from 'next-auth/jwt'
import _ from 'lodash'
import { Op } from 'sequelize'
import { GoogleGenAI } from '@google/genai'
// var corsOptions = {
//   origin: 'https://chunithm-net-eng.com.com',
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }
const cors = Cors({
    methods: ['GET'],
})

interface PlaceDescriptionResponse {
    description: string;
    map_link?: string;
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<PlaceDescriptionResponse>
) {
    await runMiddleware(req, res, cors)

    const { image_url } = req.query;

    if (!image_url || typeof image_url !== 'string') {
        throw new BadRequestError('Please provide a valid image URL');
    }

    const ai = new GoogleGenAI({});

    const imageUrl = image_url;

    const imageResponse = await fetch(imageUrl);
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const base64ImageData = Buffer.from(imageArrayBuffer).toString('base64');

    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: [
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64ImageData,
                },
            },
            { text: `
                Help me to detect the place in this image. And describe that place (not the image) with few sentences.
                If avaliable, give me the google map link that redirect to this place. 
                If this is not a place or you can find the place, just suggest a place that may be related to the image.
                return the result in { description, map_link }
                ` }
        ],
    });

    console.log(result.text);
    const json = JSON.parse(result.text ?? "{}");

    const response: PlaceDescriptionResponse = {
        description: json.description ?? "",
        map_link: json.map_link
    };
    
    res.status(200).json(response);
}

export default withErrorHandler(handler)