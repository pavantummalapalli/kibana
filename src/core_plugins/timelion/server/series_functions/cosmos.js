//http://10.47.4.67/api/query

var _ = require('lodash');
var fetch = require('node-fetch');
var moment = require('moment');
var Datasource = require('../lib/classes/datasource');


module.exports = new Datasource ('cosmos', {
  args: [
    {
      name: 'requestURL', // _test-data.users.*.data
      types: ['string'],
      help: 'opentsdb api endpoint'
    },

    {
      name: 'aggregator',
      types: ['string'],
      help: 'opentsdbi api aggregator'
    },

    {
      name: 'metric',
      types: ['string'],
      help: 'metric to pull, eg _test-data.users.host.data'
    },

    {
      name: 'tags',
      types: ['string'],
      help: 'tags should be key values eg: host=*,dc=lax'
    }
  ],
  help: `[experimental] Pull data from cosmos.`,
  fn: function cosmos(args, tlConfig) {

    var config = args.byName;

    var time = {
      min: moment(tlConfig.time.from).unix(),
      max:  moment(tlConfig.time.to).unix()
    };

    var URL = config.requestURL +
      '?start=' + time.min +
      '&end=' + time.max;

    var metricBuild = '';

    if (config.tags !== undefined) {
      metricBuild = '&m=' + config.aggregator + ':' + config.metric + '{ ' + config.tags + '}';
    }

    else {
      metricBuild = '&m=' + config.aggregator + ':' + config.metric;
    }

    URL = URL + metricBuild;

    return fetch(URL).then(function (resp) {
      return resp.json();
    }).then(function (resp) {
      var data = [];
      if (resp.length === 0) {
        data = [[]];
      }
      else {
        _.each(resp[0].dps, function (val,key) {
          data.push([key * 1000, val]);
        });
      }
      var list =  [{
        data: data,
        type: 'series',
        fit: 'nearest', // TODO make this customizable
        label: config.metric
      }];

      return {
        type: 'seriesList',
        list: list
      };
    }).catch(function (e) {
      throw e;
    });
  }
});
