import os
import json
import fileinput
import subprocess
import sys

def main():
    config_f = open("js_build.json", "r")
    config = json.loads(config_f.read())

    header = "/**\n"
    for line in open(config["header"], "r"):
        header += " * " + line
    header += "\n */\n"

    prefix = config.get("prefix", './')
    compressor = config["yuicompressor"]

    for k, v in config["jobs"].iteritems():
        v = map(lambda x: prefix + x, v)
        command = "java -jar pl1 -o pl2 --type js".split(' ')
        command[2] = compressor
        command[4] = k
        print "Processing for %s" % k
        print "Using: %s" % ' '.join(command)
        sys.stdout.flush()
        p = subprocess.Popen(command, stdin=subprocess.PIPE, stderr=subprocess.PIPE)

        lines = [0]
        cur_line = 0
        for in_f in v:
            for line in open(in_f, "r"):
                p.stdin.write(line)
                if not line.endswith('\n'):
                    p.stdin.write('\n')
                p.stdin.flush()
                cur_line += 1
            lines.append(cur_line)
        p.stdin.close()

        parse = False
        for line in p.stderr:
            if parse:
                # parse line number
                (ln, pos, after) = line.partition(':')
                ln = int(ln.strip())
                for i in xrange(1, len(lines) + 1):
                    if ln <= lines[i]:
                        print "%s:%d:%s" % (v[i - 1], ln - lines[i - 1], after),
                        break;
                parse = False
            else:
                if line.startswith("[ERROR]"):
                    print line,
                    parse = True
                else:
                    break;
        p.wait()

        for ln, line in enumerate(fileinput.input(k, inplace=1)):
            if ln == 0:
                print header
            print line,

if __name__ == "__main__":
    main()
