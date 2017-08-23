Ext.define("settings-example", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    items: [
        {xtype:'container',itemId:'message_box',tpl:'Hello, <tpl>{_refObjectName}</tpl>'},
        {xtype:'container',itemId:'display_box'}
    ],

    integrationHeaders : {
        name : "settings-example"
    },

    config: {
      defaultSettings: {
         mysetting: [{
           field1: 'this thing',
           field2: 'that thing'
         },{
           field1: 'thing 1',
           field2: 'thing 2'
         }]
      }
    },

    launch: function() {
        console.log('this.getSettings', this.getSettings());
    },
    getSettingsFields: function(){
        return [{
          xtype: 'mysettingscomponent',
          name: 'mysetting',
          fieldLabel: 'my setting',
          margin: 15,
          labelAlign: 'top'
        }];
    },

    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },

    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },

    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    }

});
