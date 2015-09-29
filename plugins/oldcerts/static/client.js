plugins.oldcerts = {

    html: null,

    start: function() {
        html = ('<div class="plugin" id="oldcerts"><h1>Old Certs</h1><div class="fader"></div><ol></ol></div>');
        $('div#body').append(html);
    },

    receiveData: function(data) {
        var container = $('div#oldcerts ol');
        container.html('');

        data = data[0]
        if (data.length == 0) {
            container.html('<strong>All certs are fresh as a daisy :)</strong>');
            return;
        }
        for (c in data) {
            var cert = data[c];

            var node = $('<li>'+cert.siteid+'<span class="'+cert.state+'">'+cert.expirydate+'</span></div>');
            node.hide();
            container.append(node);
            node.fadeIn(1000);
        }
    }
}
