var GitHubApi = require("github");
var _ = require('lodash');
var config = require('./config.js');
var fs = require('fs');
var argv = require('boring')();
var dayjs = require('dayjs');
var weekOfYear = require('dayjs/plugin/weekOfYear');
var weekYear = require('dayjs/plugin/weekYear')
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);

var starsGrouped = {};

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

if (argv.now) {
  currentReport();
  return;
}

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

  if (argv.frequency === 'weekly') {
    result.data.forEach(groupByWeek);
  } else {
    result.data.forEach(groupByMonth);
  }

  if (github.hasNextPage(result)) {
    return github.getNextPage(result, {
      Accept: 'application/vnd.github.v3.star+json',
    }, next);
  }
  done();
}

function groupByMonth (datum) {
  var matches = datum.starred_at.match(/^\d\d\d\d\-\d\d/);
  if (!matches) {
    return;
  }
  if (!starsGrouped[matches[0]]) {
    starsGrouped[matches[0]] = 0;
  }
  starsGrouped[matches[0]]++;
}

function groupByWeek (datum) {
  var matches = datum.starred_at.match(/^\d\d\d\d\-\d\d\-\d\d/);
  if (!matches) {
    return;
  }

  const year = dayjs(matches[0]).weekYear();
  let week = dayjs(matches[0]).week();
  week = week.toString().length === 2 ? week : '0' + week;
  console.log(`${year}-${week}`);
  if (!starsGrouped[`${year}-${week}`]) {
    starsGrouped[`${year}-${week}`] = 0;
  }
  starsGrouped[`${year}-${week}`]++;
}

function done() {
  fs.writeFileSync('./data.json', JSON.stringify(starsGrouped));
  if (argv.frequency === 'quarterly') {
    quarterlyReport();
  } else if (argv.frequency === 'weekly') {
    weeklyReport();
  } else {
    monthlyReport();
  }
}

function monthlyReport() {
  var keys = _.keys(starsGrouped);
  var first = _.first(keys);
  var last = _.last(keys);
  var stamp = first;
  var matches;
  var lines = [];

  while (stamp <= last) {
    lines.push(stamp + ',' + (starsGrouped[stamp] || 0))
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

  if (argv.reverse) {
    lines.reverse();
  }

  lines.forEach(line => {
    console.log(line);
  });
}

function quarterlyReport() {
  var starsByQuarter = {};
  _.each(starsGrouped, function(stars, quarter) {
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

  var lines = [];

  while (stamp <= last) {
    lines.push(stamp + ',' + (starsByQuarter[stamp] || 0));
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

  if (argv.reverse) {
    lines.reverse();
  }

  lines.forEach(line => {
    console.log(line);
  });
}

function currentReport () {
  github.repos.get({
    owner: 'punkave',
    repo: 'apostrophe',
    headers: {
      Accept: 'application/vnd.github.v3.star+json',
    },
  }, function (err, result) {
    if (err) {
      console.error(err);
      return;
    }
    console.log('Stars: ', result.data.stargazers_count);
    console.log('Issues: ', result.data.open_issues_count);
    console.log('Watching:', result.data.subscribers_count)
  });
}

function weeklyReport() {
  var keys = _.keys(starsGrouped);
  var first = _.first(keys);
  var last = _.last(keys);
  var stamp = first;
  var matches;
  var lines = [];

  while (stamp <= last) {
    lines.push(stamp + ',' + (starsGrouped[stamp] || 0))
    matches = stamp.match(/^(\d\d\d\d)\-(\d\d)$/);
    var year, week;
    if (matches) {
      year = parseInt(matches[1]);
      week = parseInt(matches[2]);
      week++;
      if (week > 52) {
        week = 1;
        year++;
      }
      if (week < 10) {
        week = '0' + week.toString();
      }
      stamp = year + '-' + week;
    }
  }

  if (argv.reverse) {
    lines.reverse();
  }

  lines.forEach(line => {
    console.log(line);
  });
}