import os
import requests
import json
import time
import ConfigParser
import logging
import datetime


CONFIG = {}

def setup_config():
    global CONFIG

    # Load global config file
    path = os.path.join(os.path.dirname(__file__), '../../config.ini')
    conf = ConfigParser.ConfigParser()
    conf.readfp(open(path))

    host = conf.get('general', 'host')
    port = conf.get('general', 'port')
    CONFIG['host'] = '%s:%s' % (host, port)

    # Load module config file
    path = os.path.join(os.path.dirname(__file__), 'config.ini')
    conf = ConfigParser.ConfigParser()
    conf.readfp(open(path))

    CONFIG['apiurl'] = conf.get('general', 'apiurl')
    CONFIG['username'] = conf.get('general', 'username')
    CONFIG['password'] = conf.get('general', 'password')


# Generic push to dashboard function
def dashboard_push_data(plugin, data):
    global CONFIG

    data = [('data', json.dumps(data))]
    print "push!"
    print data
    r = requests.post('http://%s/update/%s' % (CONFIG['host'], plugin), data=data)


def html_escape(text):
    if not isinstance(text, basestring):
        # Not a string
        return text

    html_escape_table = {
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
        ">": "&gt;",
        "<": "&lt;",
    }

    return "".join(html_escape_table.get(c,c) for c in text)


def main():
    global CONFIG
    setup_config()

    url = CONFIG['apiurl']
    creds = (CONFIG['username'], CONFIG['password'])

    while 1:
        try:
            r = requests.get(url+'/config/pipeline_groups', auth=creds, verify=False)
            failedpipes = []

            for group in r.json():
                print "group:", group['name']
                for pipeline in group['pipelines']:
                    #time.sleep(1)  #no dossss
                    print "checking pipe:", pipeline['name']
                    history = requests.get(url+"/pipelines/%s/history/0" % pipeline['name'], auth=creds, verify=False)
                    history = history.json()
                    if len(history['pipelines']) == 0:
                        print "no pipeline instances yet"
                        continue

                    try:
                        failedstages = []
                        for stage in history['pipelines'][0]['stages']:
                            if not 'result' in stage:
                                print "no result for stage %s yet" % stage['name']
                                continue
                            if stage['result'] == 'Failed':
                                failedstages.append(html_escape(stage['name']))

                            if len(failedstages) != 0:
                                failedpipes.append({'pipename': html_escape(pipeline['name']), 'failedstages': ', '.join(failedstages)})
                    except:
                        e = sys.exc_info()[0]
                        print "something went oopsie while checking pipeline %s: %s" % (pipeline['name'], e)
                        continue

            # push, push push!
            dashboard_push_data('gocd', {'failedpipes': failedpipes})

        except Exception as e:
            print 'Exceptional exception!'
            logging.exception(e)

        time.sleep(300)

if __name__ == "__main__":
    main()

