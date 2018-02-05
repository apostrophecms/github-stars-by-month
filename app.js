var GitHubApi = require("github");
var _ = require('lodash');
var config = require('./config.js');
var fs = require('fs');
var argv = require('boring')();

var starsByMonth = {};

// starsByMonth = JSON.parse(fs.readFileSync('./data.json'));
// done();
// process.exit(0);

var github = new GitHubApi({
    // optional 
    protocol: "https",
    headers: {
        "user-agent": "stars-by-month" // GitHub is happy with a unique user agent 
    },
    Promise: require('bluebird'),
    timeout: 5000
});
github.authenticate({
  type: 'token',
  token: config.token
});
 
// TODO: optional authentication here depending on desired endpoints. See below in README. 
 
github.activity.getStargazersForRepo({
    owner: 'punkave',
    repo: 'apostrophe',
    headers: {
      Accept: 'application/vnd.github.v3.star+json',
    },
}, next);

function next(err, result) {
  if (err) {
    console.error(err);
    return;
  }
  result.data.forEach(function(datum) {
    var matches = datum.starred_at.match(/^\d\d\d\d\-\d\d/);
    if (!matches) {
      return;
    }
    if (!starsByMonth[matches[0]]) {
      starsByMonth[matches[0]] = 0;
    }
    starsByMonth[matches[0]]++;
  });
  if (github.hasNextPage(result)) {
    return github.getNextPage(result, {
      Accept: 'application/vnd.github.v3.star+json',
    }, next);
  }
  done();
}

function done() {
  fs.writeFileSync('./data.json', JSON.stringify(starsByMonth));
  if (argv.frequency === 'quarterly') {
    quarterlyReport();
  } else {
    monthlyReport();
  }
}

function monthlyReport() {
  var keys = _.keys(starsByMonth);
  var first = _.first(keys);
  var last = _.last(keys);
  var stamp = first;
  var matches;
  while (stamp <= last) {
    console.log(stamp + ',' + (starsByMonth[stamp] || 0));
    matches = stamp.match(/^(\d\d\d\d)\-(\d\d)$/);
    var year, month;
    if (matches) {
      year = parseInt(matches[1]);
      month = parseInt(matches[2]);
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
      if (month < 10) {
        month = '0' + month.toString();
      }
      stamp = year + '-' + month;
    }
  }
}

function quarterlyReport() {
  var starsByQuarter = {};
  _.each(starsByMonth, function(stars, quarter) {
    matches = quarter.match(/^(\d\d\d\d)\-(\d\d)$/);
    var year, month, quarter;
    if (matches) {
      year = parseInt(matches[1]);
      month = parseInt(matches[2]);
      quarter = (((month - 1) - ((month - 1) % 3)) / 3) + 1;
      quarter = '0' + quarter;
      var quarter = year + '-' + quarter;
      starsByQuarter[quarter] = starsByQuarter[quarter] || 0;
      starsByQuarter[quarter] += stars;
    }
  });
  var keys = _.keys(starsByQuarter);
  var first = _.first(keys);
  var last = _.last(keys);
  var stamp = first;
  var matches;
  while (stamp <= last) {
    console.log(stamp + ',' + (starsByQuarter[stamp] || 0));
    matches = stamp.match(/^(\d\d\d\d)\-(\d\d)$/);
    var year, quarter;
    if (matches) {
      year = parseInt(matches[1]);
      quarter = parseInt(matches[2]);
      quarter++;
      if (quarter > 4) {
        quarter = 1;
        year++;
      }
      quarter = '0' + quarter.toString();
      stamp = year + '-' + quarter;
    }
  }
}
