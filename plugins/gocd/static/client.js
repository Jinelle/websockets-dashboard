plugins.gocd = {

    html: null,

    start: function() {
        html = ('<div class="plugin" id="gocd"><h1>GoCD failed pipelines</h1><div class="fader"></div><ol></ol></div>');
        $('div#body').append(html);
    },

    receiveData: function(data) {

        var container = $('div#gocd ol');
        container.html('');
        console.log(data[0].failedpipes);

        // update builds
        for (c in data[0].failedpipes) {
            var content = data[0].failedpipes[c];

            //var link = $('<a>').attr('href', href).html(name);
            var node = $('<li>'+content.pipename+' (<span class="failedstages">'+content.failedstages+'</span>)</li>');
            //node.html(link);
            node.hide();

            container.append(node);

            node.fadeIn(1000);
        }

    }
}
