plugins.nagios = {

    html: null,

    start: function() {
        html = ('<div class="plugin" id="nagios"> \
                <h1>Server States</h1> \
                <div class="lastchange"></div> \
                <audio id="audio-critical" src="/plugin/nagios/gong.mp3" type="audio/mpeg" controls></audio> \
                </div>');
        $('div#body').append(html);

        $.getScript(base_url + '/plugin/nagios/jquery.timeago.js');

        // Produce audio alert when a cluster goes critical (red)
        $('#audio-critical').hide();
        var notified = 0;
        window.setInterval(function () {
                var brokencount = $('#nagios h2.critical').length;
                if (brokencount > 0) {
                    if (brokencount > notified) {
                        console.log('Critical server!');
                        $('#audio-critical')[0].load();  // required for replays
                        $('#audio-critical')[0].play();

                        if ($('.dashboard-fullscreen').length) {
                            transitioner.stop();
                            transitioner.config.toshow = $('.dashboard-fullscreen #nagios');
                            transitioner.plugin_transition();

                            transitioner.start();
                        }
                    }
                    notified = brokencount;
                } else {
                    notified = 0;  // reset the notification
                }
            }, 1000);

    },

    receiveData: function(data) {

        // Check for a single message (is not array?)
        if (!$.isArray(data)) {
            data = [data];
        }

        var container = $('div#nagios');

        // Only care about the newest message
        data = data.pop();

        // Update last change time
        var lastchange = $('div.lastchange', container);
        if (data['lastchange']) {
            var c = new Date();
            c.setTime(data['lastchange'] * 1000);
            lastchange.html('Last change: '+c.toDateString()+' '+c.toTimeString());
        }

        // Loop through each "group" (nagios hostgroup)
        for (c in data['groups']) {

            var title = c;
            var codes = data['groups'][c];

            // Add if not already in list
            var group = $('div#'+title, container);
            if (!group.length) {
                var group = $('<div id="'+title+'"><h2>'+title+'</h2><ul></ul></div>');
                $('h1', container).after(group);
            }

            // Loop through checks reporting non-success status
            var codelist = $('ul', group);
            codelist.html('');
            for (cstate in codes) {
                var checks = codes[cstate];
                for (cc in checks) {
                    cc = checks[cc];

                    var c_meta = $('<span>').addClass('meta');

                    if (cc['downtimed']) {
                        c_meta.html('DOWNTIMED');
                    } else {
                        c_meta.html(cc['duration']);
                    }

                    var c_state = $('<span>').addClass('state').attr('title', cstate).html('&#9679;');
                    var c_li = $('<li>').addClass(cstate);

                    c_li.html('['+cc['server']+'] '+cc['service']);
                    c_li.prepend(c_state);
                    c_li.prepend(c_meta);

                    codelist.append(c_li);
                }
            }

            // Set state of group
            group.find('h2').attr('class', data['states'][c][0]);

            // Set date state last changed

            // First, build data object
            var lc = new Date();
            lc.setTime(data['states'][c][1] * 1000);

            // Create new abbr and replace old (timeago plugin doesn't like the time changing)
            var abbr = $('<abbr class="timeago"></abbr>').attr('title', lc.toISOString());
            group.find('h2').attr('title', lc.toDateString()+' '+lc.toTimeString());

            // Replace, or add new
            if (group.find('h2 abbr').length) {
                group.find('h2 abbr').replaceWith(abbr);
            } else {
                group.find('h2').append(abbr);
            }
            if (abbr.timeago) {
                abbr.timeago();
            }
        }
    }
}
