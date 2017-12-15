Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
        //Write app code here
        this._buildChartData().then({
            success: function(chartData){
               var items = [
                 this._getExportButton(),
                 this._buildChart(chartData),
                 this._buildGrid(chartData)
               ];

               this.add({
                   xtype: 'container',
                   //layout: {type: 'vbox'},
                   items: items
               });
            },
            scope: this
        });

        //API Docs: https://help.rallydev.com/apps/2.1/doc/
    },
    _getExportButton: function(){
        return {
           xtype: 'rallybutton',
           iconCls: 'icon-export',
           margin: 25,
           listeners: {
              click: this._exportMyData,
              scope: this
           }
        };
    },
    _exportMyData: function(){
        console.log('_exportMyData');

         var grid = this.down('rallygrid');
         if (!grid){
            alert ('Nothing to export');
            return;
         }

         var store = grid.getStore();

         var columns = grid.columnCfgs;
         var csv = [];

         var headerRow = Ext.Array.map(columns, function(col){
             return col.text;
         });
         headerRow = headerRow.join(',');
         csv.push(headerRow);

         store.each(function(record){
           var row = [];
           Ext.Array.each(columns, function(col){
              row.push(record.get(col.dataIndex));
           });
           row = row.join(',');
           csv.push(row);
         });

         csv = csv.join('\r\n');
         console.log('csv',csv);

         FileUtility.saveAs(csv, "my-csv-file.csv");

    },
    _buildGrid: function(chartData){
         var data = [];
         for (var j=0; j < chartData.series.length; j++){
           var row = {
                name: chartData.series[j].name
           };
           for (var i=0; i < chartData.categories.length; i++){
               row[chartData.categories[i]] = chartData.series[j].data[i];
           }
           row.total = Ext.Array.sum(chartData.series[j].data);
           data.push(row);
         }

         var fields = Ext.Object.getKeys(data[0]);
         console.log('data',data, fields);

         var store = Ext.create('Rally.data.custom.Store',{
            data: data,
            fields: fields
         });

         return {
                xtype: 'rallygrid',

                columnCfgs: [{
                  dataIndex: 'name',
                  text: 'Name'
                },{
                   dataIndex:'Defined',
                   text: 'Defined'
                },{
                   dataIndex:'In-Progress',
                   text: 'In-Progress'
                },{
                   dataIndex:'Completed',
                   text: 'Completed'
                },{
                   dataIndex:'Accepted',
                   text: 'Accepted',
                   renderer: function(val,metaData, record){
                       var total = record.get('total') || 0;
                       var acceptedPct = (total > 0 ? val/total : 0) * 100;
                      console.log('acceptedPct', acceptedPct);
                       metaData.style = 'background-color:green;';
                       if (acceptedPct < 50 ){
                           metaData.style = 'background-color:yellow;';
                       }
                       if (acceptedPct < 25){
                           metaData.style = 'background-color:red;';
                       }
                       return val;

                   }
                },{
                   dataIndex: 'total',
                   text: 'Total'
                }],
                store: store,
                showPagingToolbar: false,
                showRowActionsColumn: false
             };

    },
    _buildChart: function(chartData){

        return {
           xtype: 'rallychart',
           chartData: chartData,
           chartColors: [Rally.util.Colors.orange_med,Rally.util.Colors.blue_med],

           height: 400,
           chartConfig: {
              chart: {
                 type: 'column'
              },
              title: {
                 text: 'Artifacts by Schedule State'
              },
              plotOptions: {
                column: {
                  dataLabels: {
                     enabled: true
                  },
                  point: {
                    events: {
                       click: function(evt){
                            console.log('evt', evt.point);
                           alert(evt.point.y + " " + evt.point.series.name + "(s) are " + evt.point.category);
                       }
                    }
                  }
                }
              }

           }
        };
    },
    _showErrorNotification: function(errorMessage){
       alert(errorMessage);
    },
    _buildChartData: function(){
      var deferred = Ext.create('Deft.Deferred');

      Deft.Chain.parallel([
          function(){ return this._getArtifactCountByState('UserStory','Defined') },
          function(){ return this._getArtifactCountByState('UserStory','In-Progress') },
          function(){ return this._getArtifactCountByState('UserStory','Completed') },
          function(){ return this._getArtifactCountByState('UserStory','Accepted') },
          function(){ return this._getArtifactCountByState('Defect','Defined') },
          function(){ return this._getArtifactCountByState('Defect','In-Progress') },
          function(){ return this._getArtifactCountByState('Defect','Completed') },
          function(){ return this._getArtifactCountByState('Defect','Accepted') },
      ], this).then({
         success: function(results){
             console.log('results', results);
             var categories = [
                    'Defined',
                    'In-Progress',
                    'Completed',
                    'Accepted'
                ];
                var series = [{
                   name: 'Defects',
                   data: [results[4],results[5],results[6],results[7]]
                },{
                   name: 'User Stories',
                   data: [results[0],results[1],results[2],results[3]]
                }];

                var chartData = {
                    series: series,
                    categories: categories
                }
                deferred.resolve(chartData);
         }
      })
      // var chartData = {
      //    categories: [
      //        'Defined',
      //        'In-Progress',
      //        'Completed',
      //        'Accepted'
      //    ],
      //    series: [{
      //       name: 'Defects',
      //       data: [1,2,3,4]
      //    },{
      //       name: 'User Stories',
      //       data: [4,3,2,1]
      //    }]
      // };
      return deferred.promise;
    },
    _getArtifactCountByState: function(artifactType, state){
        var deferred = Ext.create('Deft.Deferred');

        var store = Ext.create('Rally.data.wsapi.Store',{
            model: artifactType,
            fetch: ['ObjectID','FormattedID','ScheduleState'],
            filters: [{
               property: 'ScheduleState',
               value: state
            }]
        }).load({
             callback: function(records, operation){
                  if (operation.wasSuccessful()){
                     //This will return the count of stories that met the filter criteria in the promise's success function because we
                     //are using the "resolve" method of the deferred object.
                     deferred.resolve(operation.resultSet.totalRecords);
                  } else {
                     //If we get an error, then we will return the error in the promises failure function via the "reject " method of the deferred object
                     deferred.reject('Error loading story count');
                  }
             }
        });

        return deferred.promise;
    },
});
