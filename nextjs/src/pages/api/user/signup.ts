
import { NextApiRequest, NextApiResponse } from 'next';
import { hash, hashSync } from 'bcryptjs'
import Users from 'db/model/users';
import { BadRequestError } from 'errors/BadRequestError';
import { where } from 'sequelize/types';
import { StatusCodes } from 'http-status-codes';
import withErrorHandler from 'utils/errorHandler';


async function signup(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const saltRounds = 10;

  if (req.method === 'POST') {

    // Store hash in your password DB.
    const hashedPassword = await hash(req.body.password, saltRounds)

    const user = await Users.findOne({ where: { username: req.body.username, } })
    if (!user) {
      const newUser = await Users.create({ username: req.body.username, password: hashedPassword })
      res.status(200).json(newUser);
    }
    else {
      throw new BadRequestError('user already existed')
    }

    // else {
    //   throw new BadRequestError('user is created')
    // }

  } else {
    res.status(StatusCodes.NOT_ACCEPTABLE).json({ message: 'We only support POST' });
  }
}

export default withErrorHandler(signup)
