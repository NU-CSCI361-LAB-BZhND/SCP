# Supplier Consumer Platform

## How to run

1. Run `docker compose up`
2. Once it's running, run `docker compose exec api python manage.py migrate`
   (You only need to do this once)
3. Go to `web/` directory and run `npm install && npm run dev` there
4. Change IP of the server in `SERVER_URL` variable in `mobile/util/fetch.ts` to
   match the server's actual IP address
5. Go to `mobile/` directory and run `npm install && npx expo start` there

The website should be available at port :3000 of the server.

To run the mobile app, download the Expo Go app and use it to scan the QR code
that appeared after `npx expo start`.
