# Google route map setup

CreateTrip now uses Google Maps JavaScript API's Routes Library. A selected Google
Route supplies the polyline, distance, duration, and fare calculation. It no longer
calls the independent backend estimate or embeds a separately calculated Google
Maps route. Choosing an alternative changes all displayed values together.

## Required configuration

1. In Google Cloud, configure billing and enable **Maps JavaScript API** and
   **Routes API** for the project.
2. Create a browser API key. Restrict its HTTP referrers to the actual frontend
   domains (and localhost for development), and its APIs to those two services.
3. Copy `frontend/.env.example` to `frontend/.env`, then set
   `VITE_GOOGLE_MAPS_API_KEY`. Optionally set `VITE_GOOGLE_MAPS_MAP_ID` to your map ID;
   the default is Google's demo map ID.
4. Restart Vite for local development. For deployment, set these variables in the
   frontend build environment and rebuild. Vite embeds browser keys in the bundle;
   do not use a server key with unrestricted permissions.

The backend `GOOGLE_MAPS_API_KEY` is independent and is not exposed to the browser.
There is no configured Google key in the checked-out local environment. Production
Google requests and map rendering require the configuration above before release.
API usage may incur Google charges.

## Behavior and verification

- Enter different origin/destination pairs and compare the map's distance and
  duration label against the summary above. Both use the same formatter and Route.
- Select each alternative: the displayed line, distance, duration, and recommended
  price must change together.
- Change seats or round-trip pricing: costs update without requesting another route.
  Round-trip pricing retains the existing outbound-distance-times-two estimate;
  it does not calculate the actual return route.
- Edit endpoints quickly: old requests must not replace the current route. Clearing
  an endpoint clears the old route and disables submission.
- Invalid locations, network errors, or missing API configuration show an error
  and clear the estimate instead of returning a fabricated distance.
- Opening Google Maps externally starts a separate Google Maps session, which can
  choose another route or use newer traffic data. The synchronization guarantee
  applies to the embedded map and summary within this app.

Run `node --test frontend/tests/googleRoutes.test.mjs` and `npm run build`.

References:
- https://developers.google.com/maps/documentation/javascript/routes/get-a-route
- https://developers.google.com/maps/documentation/javascript/reference/route
- https://developers.google.com/maps/documentation/javascript/get-api-key
