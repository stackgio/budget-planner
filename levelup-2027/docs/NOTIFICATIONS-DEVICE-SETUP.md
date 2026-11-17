# Notifications: Device Setup, Troubleshooting & Delivery Notes

**Status:** in-app notifications work locally. Push notifications have **not** been tested on a real device. Push stays off until the app is deployed over HTTPS and push (VAPID) keys are configured, and both need your approval.

## iPhone setup (after deployment)

1. You need iOS/iPadOS 16.4 or later.
2. Open the HTTPS address in **Safari**, then Share → **Add to Home Screen**.
3. Open LEVEL UP **from the Home Screen icon**. Push doesn't work inside a Safari tab.
4. Go to Settings → Notifications → **Enable on this device**, then tap **Allow** when iOS asks.
5. Tap **Send a simulated test**. This places a test item in the notification center; it never sends a push.
6. Look at the **Diagnostics** card. It shows:
   - push keys
   - when the worker last ran
   - devices
   - the last 7 days of notifications
   - this device's HTTPS, service worker, permission, subscription, iOS version and Home Screen status

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Push keys: Not configured" | Expected locally. Push needs an approved HTTPS deployment |
| "Worker … not running now" | Run `npm run worker` locally, or check the deployed worker. In-app items appear once it runs |
| Permission "denied" | iPhone Settings → Notifications → LEVEL UP → Allow. On desktop, use the address-bar site settings |
| No subscription on iPhone | Open from the Home Screen icon, not Safari, then enable again |
| Device "failing" | Turn push off and on again on that device. Devices the push service reports as gone (404/410) are removed automatically |
| Nothing arrives during quiet hours or a heavy work mode | Working as designed. Check the settings |

## The rare duplicate-delivery case, and what was done about it

- **Cause.** The worker records a push only after the push service accepts it. If the worker stops in the moment between "sent" and "recorded", it can't know whether the push went out. Retrying could produce a second copy. Not retrying could lose one.
- **What we do.** Each send is marked **in-flight** before it goes out, and three things limit duplicates:
  1. **No immediate retry.** An in-flight send with an unknown outcome waits 10 minutes before it is retried, and it is retried at most 3 times in total.
  2. **Same tag.** Every push for a notification carries the same `tag`. iOS and browsers **replace** a shown notification that has the same tag instead of showing a second one.
  3. **Push-service topic.** Each push carries a Web Push **Topic** (a hash of the tag). The push service keeps only the newest undelivered message per topic, so a retry replaces a still-queued copy.
- **Guarantee.** Delivery is at-least-once per round, and a duplicate normally won't be visible. Exactly-once delivery can't be guaranteed across Apple's or Google's push services, and LEVEL UP doesn't claim it.
