// declare global {
//     namespace NodeJS {
//         interface ProcessEnv {
//             JWT_SECRET: string;
//             NEXTAUTH_SECRET : string
//         }
//     }
// }
import Users from 'db/model/users';
import 'next-auth'
declare module "next-auth" {
    interface User {
        user: Users;
    }

    interface Session {
        user: Users;
    }
}
export {}