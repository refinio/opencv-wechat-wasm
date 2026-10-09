# Backwards-compatibility policy

- Absolutely no backwards compatibility is required; always make hard cuts.
- Internal refactors must remove obsolete paths and update every in-repository consumer in the same change.
- Public interfaces may break without migration layers; external consumers receive no compatibility guarantee.
