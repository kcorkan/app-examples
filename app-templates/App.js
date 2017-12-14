Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        //Write app code here
        this.add({
           xtype:'container',
           html: 'this is an app that demonstrates different templates using rab --templates ./templates'
        });
        //API Docs: https://help.rallydev.com/apps/2.1/doc/
    }
});
