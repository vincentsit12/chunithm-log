/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["info"] } : false
  },
  async redirects() {
    return [
      // Basic redirect
      {
        source: '/playground/guess_song_game/rooms',
        destination: '/song_guesser/rooms',
        permanent: true,
      },
      {
        source: '/song_guesser',
        destination: '/song_guesser/rooms',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
