plugins.gocd = {

    html: null,

    start: function() {
        html = ('<div class="plugin" id="gocd"><h1>GoCD failed pipelines</h1><div class="fader"></div><ol></ol></div>');
        $('div#body').append(html);
    },

    receiveData: function(data) {

        var container = $('div#gocd ol');
        container.html('');

        // update builds
        for (c in data[0].failedpipes) {
            var content = data[0].failedpipes[c];

            var link = $('<a></a>').attr('href', content.url).html(content.pipename);
            var node = $('<li></li>');
            var failedstages = $('<span class="failedstages"></span>').html(' ('+content.failedstages+')');
            var toblame = $('<div class="toblame"></div>').html(content.toblame);
            node.html(link).append(failedstages).append(toblame);
            node.hide();

            container.append(node);

            node.fadeIn(1000);
        }

    }
}
