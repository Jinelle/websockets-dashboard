plugins.moodleversion = {

    html: null,

    start: function() {
        dashletbase = ('<div class="plugin" id="moodleversion"> \
                <h1>Moodle Version Sitrep</h1> \
                <div class="lastchange"></div> \
                </div>');
        $('div#body').append(dashletbase);
        $.getScript(base_url + '/plugin/moodleversion/jquery.timeago.js');
    },

    receiveData: function(data) {
        // Check for an array message (is array?)
        if ($.isArray(data)) {
            // Only care about the newest message
            data = data.pop();
        }

        var dashletdiv = $('div#moodleversion');
        var existing = $('li', dashletdiv).clone();


        // Last change
        var lastchange = $('div.lastchange', dashletdiv);
        if (data['lastchange']) {
            var c = new Date();
            c.setTime(data['lastchange'] * 1000);
            lastchange.html('Last change: '+c.toDateString()+' '+c.toTimeString());
        }

        for (version in data['moodleinfo']) { //eg v in (1.9, 2.1 ...)
            var versioninfo = data['moodleinfo'][version] // Info about this version of moodle.
            divid = 'moodleversion' + version // eg moodleversion1.9
            escapeddivid = jq( divid ) // To escape any '.', ':' etc.
            var versiondiv = $( '#' + escapeddivid )
            var newversiondiv = $('<div id="'+divid+'"><span class="versiontitle">'+version+'</span></div>');

            if (versiondiv.length == 0) {
                // There was no div of that id in dashletdiv.
                // Create one.
                dashletdiv.append(newversiondiv) // Put the new versiondiv at the end of the dashlet content.
                versiondiv = newversiondiv
            } else {
                // Clear out the existing one.
                versiondiv.replaceWith(newversiondiv)
                versiondiv = newversiondiv
            }
            // Apply a class to version title, to facilitiate styling it with css.
            var versiontitle = $( 'div#' + escapeddivid + ' .versiontitle' )
            if (versioninfo.supportdays <= 0) {
                versiontitle.addClass('Critical')
            } else if (versioninfo.supportdays < 90) {
                versiontitle.addClass('Warning')
            } else {
                versiontitle.addClass('OK')
            }

            var supportstring = ' ' + versioninfo.supportdays + ' days.'
            supportstring = '<span class="supportperiod">' + supportstring + '</span>'
            var supportspan = $( 'div#' + escapeddivid + ' span.supportperiod' )
            if (supportspan.length == 0) {
                // There isn't any existing supportspan; create one.
                versiondiv.append(supportstring)
            } else {
                // Replace the existing span with the new one.
                supportspan.replaceWith(supportstring)
            }

            var latestreleaseinfo = '<span class="latestrelease" title="Latest Security Release">LSR: ' + versioninfo.latestsecurity + '.</span>'
            versiondiv.append(latestreleaseinfo)
            var sitesonlatest = '<span class="latestcount" title="SiteEnvironments not on LSR">SE-LSR: ' + versioninfo.onlatestsecurity + '.</span>'
            versiondiv.append(sitesonlatest)

            // Create a section 'lagging div' to describe if there are any sites lagging behind the latest security release, and which ones.
            var laggingsummary = '<span class="laggingsummary" title="Sites not entirely on LSR">S!LSR: '
            var laggingsites = versioninfo.behindlatest
            if (laggingsites.length == 0) {
                laggingsummary = laggingsummary + '<span class="laggingcount OK"> '
            } else {
                laggingsummary = laggingsummary + '<span class="laggingcount CRITICAL"> '
            }
            laggingsummary = laggingsummary + laggingsites.length + ' </span>';
            versiondiv.append(laggingsummary)

            // Create a section 'lagging div' to describe if there are any sites lagging behind the latest security release, and which ones.
            if (laggingsites.length) {
                var laggingdiv = '<div class="behindlatest">'
                laggingdiv = laggingdiv + '</div>'
                versiondiv.append(laggingdiv)
                // There is at least one site lagging behind the latest security release. Add an unnumbered list to this div.
                var laggingdiv = $( 'div#' + escapeddivid + ' div.behindlatest' )
                var lagginglist = '<ul></ul>'
                laggingdiv.append(lagginglist)
                var laggingdiv = $( 'div#' + escapeddivid + ' div.behindlatest' )
                lagginglist = $( 'ul', laggingdiv )
    
                for (i in laggingsites) {
                    var laggingsite = laggingsites[i]
                    laggingstring = '<li><span class="laggingsite">' + laggingsite.dbname + '</span> (<span class="laggingversion">' + laggingsite.version + '</span>)</li>'
                    lagginglist.append(laggingstring)
                }
            }
        }
    }
}

// Escape dom 'id' values - replace '.' with '\\.'.
function jq( myid ) {
    return myid.replace( /(:|\.|\[|\]|,)/g, "\\$1" );
}
