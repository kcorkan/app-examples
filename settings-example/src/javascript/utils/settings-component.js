Ext.define('MySettingsComponent',{
  extend: 'Ext.form.field.Base',
     alias: 'widget.mysettingscomponent',

     fieldSubTpl: '<div id="{id}" class="settings-grid"></div>',

     width: 400,
     cls: 'column-settings',

     config: {
         value: undefined,
     },

     onDestroy: function() {
         if (this._grid) {
             this._grid.destroy();
             delete this._grid;
         }
         this.callParent(arguments);
     },

     onRender: function() {
         this.callParent(arguments);

         console.log('decodedValue', this.value);
         var decodedValue = this.value;
         if (Ext.isString(decodedValue)){
            decodedValue = Ext.JSON.decode(decodedValue);
         }

         this._store = Ext.create('Ext.data.Store', {
             fields: ['field1','field2'],
             data: decodedValue
         });
         this._buildGrid();

     },

     _buildGrid: function(){
         if (this._grid) {
             this._grid.destroy();
         }

         this._grid = Ext.create('Rally.ui.grid.Grid', {
             autoWidth: true,
             renderTo: this.inputEl,
             columnCfgs: [{
                dataIndex: 'field1',
                text: 'Field 1',
                width: 50,
                editor: {
                  xtype: 'rallytextfield'
                }
             },{
               dataIndex: 'field2',
               text: 'Field 2',
               flex:1,
               editor: {
                 xtype: 'rallytextfield'
               }
             }],
             showPagingToolbar: false,
             showRowActionsColumn: false,
             store: this._store,
             height: 225,
             flex:1,
             autoScroll: true,
             editingConfig: {
                 publishMessages: false
             }
         });

     },
     /**
      * When a form asks for the data this field represents,
      * give it the name of this field and the ref of the selected project (or an empty string).
      * Used when persisting the value of this field.
      * @return {Object}
      */
     getSubmitData: function() {
         var data = {};
         data[this.name] = Ext.JSON.encode(this._getData());
         return data;
     },

     _getData: function() {
         var setting = [];
         this._store.each(function(record) {
           var row = {};
             row['field1'] = record.get('field1');
             row['field2'] = record.get('field2');
             setting.push(row);
         });
         return setting;
     },

     getErrors: function() {
         var errors = [];
         if (this._store && !Ext.Object.getSize(this._getData())) {
             errors.push('At least one column must be shown.');
         }
         return errors;
     },

     setValue: function(value) {
         this.callParent(arguments);
         this._value = value;
     }
 });
