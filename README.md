# github-stars-by-month

First copy `config-example.js` to `config.js` and add your personal Github token
, then:

```
node app apostrophecms/apostrophe
```

## Options:

### frequency
Use `--frequency=quarterly` for quarterly data.
Use `--frequency=weekly` for weekly data (this uses a Sunday - Saturday week).

### reverse
Use `--reverse` to see the data in reverse chronological order.

### now
For a quick snapshot of the current status, use `--now`.

## TODO:

- [ ] clean this up as something you can `npm install -g`.
