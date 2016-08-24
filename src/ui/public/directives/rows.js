define(function (require) {
  var $ = require('jquery');
  var _ = require('lodash');
  var module = require('ui/modules').get('kibana');
  var AggConfigResult = require('ui/Vis/AggConfigResult');

  module.directive('kbnRows', function ($compile, $rootScope, getAppState, Private) {
    var filterBarClickHandler = Private(require('ui/filter_bar/filter_bar_click_handler'));
    return {
      restrict: 'A',
      link: function ($scope, $el, attr) {

          function addCell($tr, contents) {
          var $cell = $(document.createElement('td'));

          // TODO: It would be better to actually check the type of the field, but we don't have
          // access to it here. This may become a problem with the switch to BigNumber
          if (_.isNumeric(contents)) $cell.addClass('numeric-value');

          var createAggConfigResultCell = function (aggConfigResult) {
            var $cell = $(document.createElement('td'));
            var $state = getAppState();
            var clickHandler = filterBarClickHandler($state);
            $cell.scope = $scope.$new();
            $cell.addClass('cell-hover');
            $cell.attr('ng-click', 'clickHandler($event)');
            $cell.scope.clickHandler = function (event) {
              if ($(event.target).is('a')) return; // Don't add filter if a link was clicked
              clickHandler({ point: { aggConfigResult: aggConfigResult } });
            };
            return $compile($cell)($cell.scope);
          };

              /***
               * ssamkj - start
               * */

              function getInterval(contents){
                  try{
                      var interval = contents.aggConfig._opts.params.interval;
                      return interval;
                  }catch(e){
                      return null;
                  }
              }

              function isFlexibleDateFormat(contents){
                  return contents.aggConfig && contents.aggConfig.vis && contents.aggConfig.vis.params && contents.aggConfig.vis.params.flexibleDateFormat;
              }


              function setDateFormat(contents){
                  var flexibleDateFormat = isFlexibleDateFormat(contents);

                  var dateType = contents.aggConfig.getFormat();
                  if(flexibleDateFormat){
                      var interval = getInterval(contents);
                      if(interval){
                          switch(interval){
                              case 's': dateType._params.pattern = 'YYYY-MM-DD HH:mm:ss';
                                  break;
                              case 'm': dateType._params.pattern = 'YYYY-MM-DD HH:mm';
                                  break;
                              case 'h': dateType._params.pattern = 'YYYY-MM-DD HH';
                                  break;
                              case 'd': dateType._params.pattern = 'YYYY-MM-DD';
                                  break;
                              case 'M': dateType._params.pattern = 'YYYY-MM';
                                  break;
                              case 'y': dateType._params.pattern = 'YYYY';
                                  break;
                              default : dateType._params.pattern = dateType.type.paramDefaults.pattern;
                                  break;
                          }
                      }
                  }else{
                      dateType._params.pattern = dateType.type.paramDefaults.pattern;
                  }
              }
              /***
               * ssamkj - the end
               * */
          if (contents instanceof AggConfigResult) {
            if (contents.type === 'bucket' && contents.aggConfig.field() && contents.aggConfig.field().filterable) {

                setDateFormat(contents);

              $cell = createAggConfigResultCell(contents);
            }
            contents = contents.toString('html');
          }

          if (_.isObject(contents)) {
            if (contents.attr) {
              $cell.attr(contents.attr);
            }

            if (contents.class) {
              $cell.addClass(contents.class);
            }

            if (contents.scope) {
              $cell = $compile($cell.html(contents.markup))(contents.scope);
            } else {
              $cell.html(contents.markup);
            }
          } else {
            if (contents === '') {
              $cell.html('&nbsp;');
            } else {
              $cell.html(contents);
            }
          }

          $tr.append($cell);
        }

        function maxRowSize(max, row) {
          return Math.max(max, row.length);
        }

        $scope.$watchMulti([
          attr.kbnRows,
          attr.kbnRowsMin
        ], function (vals) {
          var rows = vals[0];
          var min = vals[1];

          $el.empty();

          if (!_.isArray(rows)) rows = [];
          var width = rows.reduce(maxRowSize, 0);

          if (isFinite(min) && rows.length < min) {
            // clone the rows so that we can add elements to it without upsetting the original
            rows = _.clone(rows);
            // crate the empty row which will be pushed into the row list over and over
            var emptyRow = new Array(width);
            // fill the empty row with values
            _.times(width, function (i) { emptyRow[i] = ''; });
            // push as many empty rows into the row array as needed
            _.times(min - rows.length, function () { rows.push(emptyRow); });
          }

          rows.forEach(function (row) {
            var $tr = $(document.createElement('tr')).appendTo($el);
            row.forEach(function (cell) {
              addCell($tr, cell);
            });
          });

          /***
           * ssamkj - start
           * */


          function hasParameterInVis ($scope, paramName){
            if(!$scope.vis && $scope.$parent) return hasParameterInVis($scope.$parent, paramName)
            if($scope.vis.params[paramName]=== undefined) return hasParameterInVis($scope.$parent, paramName)
            return $scope.vis.params[paramName];
          }

          var list = $scope.list;
          if(_.isArray(list) && hasParameterInVis($scope, 'showSummary')){

            var sumRow = [];

            list.forEach(function(row){
              var index = 0;
              row.forEach(function(cell){
                if(sumRow[index]===undefined){
                  if(cell.type === 'metric' && _.isNumeric(cell.value)){
                    sumRow[index] = new AggConfigResult(cell.aggConfig, null, 0, 0);
                  }else{
                    sumRow[index] = index===0?'합계':'-';
                  }
                }
                if(cell.type === 'metric' && _.isNumeric(cell.value)){
                  var tmp = sumRow[index];
                  sumRow[index].key = tmp.key +cell.key;
                  sumRow[index].value = tmp.value +cell.value;
                }
                index++;
              })
            });

            var $tr = $(document.createElement('tr')).appendTo($el);
            sumRow.forEach(function (cell) {
              addCell($tr, cell);
            });
          }

          /***
           * ssamkj - the end
           * */
        });
      }
    };
  });
});
