plugins.wrms = {

    html: null,

    start: function() {
        html = ('<div class="plugin" id="wrms"><h1>Incoming WRMS</h1><div class="fader"></div><ol></ol></div>');
        $('div#body').append(html);
    },


    receiveData: function(data) {

        // Check for a single message (is not array?)
        if (!$.isArray(data)) {
            data = [data];
        }

        var container = $('div#wrms ol');
        var existing = $('li', container).clone();

        for (c in data) {
            var content = data[c];

            if (content == 1) {
                // Ignore (this is a placeholder)
                continue;
            }

            var id = 'wr-'+content.request_id;

            var d = new Date();
            d.setTime(content.last_activity_epoch_canonical * 1000);

            var c = '';
            if (content.ranking > 10000) {
                c += 'urgent ';
            }

            if (content.status_desc == 'New request') {
                c += 'new '
            }

            var find = $('li#'+id, container);

            var link = $('<a target="_blank">').html('<em>['+content.organisation_code+']</em> '+content.brief);
            link.attr('href', content.request_url);
            var status = '<span class="status">'+content.status_desc+'</span> [WR#'+content.request_id+'] ';

            // Setup date
            var lastchanged = $('<span>Last changed: </span>').attr('title', d.toDateString()+' '+d.toTimeString());
            var abbr = $('<abbr class="timeago"></abbr>').attr('title', d.toISOString());

            var node = $('<li>').attr('id', id).attr('class', c).data('date', content.last_activity_epoch);
            node.append(link).append(' - ').append(status).append(lastchanged).append(abbr);

            node.hide();

            if ($('li#'+id, container).length) {
                $('li#'+id, container).slideUp().remove();
            }

            container.prepend(node);
            if (abbr.timeago) {
                abbr.timeago();
            }
            if ($('li', container).length > 20) {
                $('li:last', container).slideUp().remove();
            }

            node.fadeIn(1000);

            // Remove from existing array
            existing = existing.filter('#'+id).remove();
        }

        if (existing.length) {
            existing.each(function() {
                $('#'+$(this).attr('id'), container).slideUp().remove();
            });
        }
    }
}
