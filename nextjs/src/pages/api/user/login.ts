
import { NextApiRequest, NextApiResponse } from 'next';
import { compare, hash } from 'bcryptjs'
import Users from 'db/model/users';
import { sign } from 'jsonwebtoken';
import { BadRequestError } from 'errors/BadRequestError';
import withErrorHandler from 'utils/errorHandler';
import { encrypt } from 'utils/encrypt';


async function login(
  req: NextApiRequest,
  res: NextApiResponse
) {

  if (req.method === 'POST') {
    let user: Users | null = await Users.findOne({ where: { username: req.body.username } })
    if (user) {
      const claims = { sub: user.username, isAdmin: user.isAdmin };
      // let jwtSecret: string | undefined = process.env.JWT_SECRET;
      const result = await compare(req.body.password, user.password)


      if (result) {
        // const jwt = sign(claims, process.env.JWT_SECRET as string, { expiresIn: '7d' });
        // const user = await Users.create({ username: req.body.username, password: hash })
        res.status(200).send({
          id: encrypt(user.id.toString()),
          username: user.username
        });
      }
      else {

        throw new BadRequestError(`wrong password`)
      }
    }
    else {
      throw new BadRequestError(`no user found`)
    }
  }
  else throw new BadRequestError(`do not accept ${req.method} `)
}


export default withErrorHandler(login)