# Destination Photos (Homepage "Destinations" Section)

This section on the homepage automatically detects which photos exist
here and only shows those — add one, several, or all of them, and the
grid adjusts. Add none, and the section shows a placeholder instead of
broken images.

## Expected filenames (any of these extensions: .jpg, .jpeg, .png, .webp)

Save a photo for any of these destinations using **exactly** this
filename (the label shown on the site is added automatically):

| Filename (without extension) | Shown as |
|---|---|
| `delhi` | Delhi |
| `agra` | Agra |
| `jaipur` | Jaipur |
| `manali` | Manali |
| `shimla` | Shimla |
| `amritsar` | Amritsar |
| `dharamshala` | Dharamshala |
| `haridwar-rishikesh` | Haridwar & Rishikesh |

Example: `frontend/public/images/destinations/manali.jpg`

## Where to get photos

Same guidance as tour package images — [unsplash.com](https://unsplash.com)
or [pexels.com](https://pexels.com), both free for commercial use. See
`../packages/README.md` for the full explanation of why local files are
used instead of hotlinking search results.

## After adding photos

Commit and push as normal — no code changes needed, the homepage picks
them up automatically on the next deploy.
