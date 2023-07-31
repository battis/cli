import { RecursivePartial } from '@battis/typescript-tricks';
import appRootPath from 'app-root-path';
import dotenv from 'dotenv';
import { jack } from 'jackspeak';
import path from 'path';
import process from 'process';
import log from './log';
import options from './options';
import { Options } from './options/types';
import shell from './shell';

export type Arguments = {
  values: { [name: string]: string };
  positionals: string[];
};

export default {
  appRoot: () => appRootPath.toString(),

  init: function(config?: RecursivePartial<Options>): Arguments {
    const opt = options.hydrate(config || {});
    if (opt.env.setRootAsCurrentWorkingDirectory) {
      process.chdir(opt.env.root);
      opt.log.root = opt.env.root;
    }
    if (opt.env.loadDotEnv === true) {
      dotenv.config();
    } else if (typeof opt.env.loadDotEnv === 'string') {
      dotenv.config({ path: path.resolve(process.cwd(), opt.env.loadDotEnv) });
    }
    const j = jack({ envPrefix: opt.args.envPrefix })
      .opt(opt.args.options)
      .optList(opt.args.optionLists)
      .flag(opt.args.flags);
    const args = j.parse();
    if (args.values['help']) {
      shell.echo(j.usage());
      process.exit(0);
    }
    opt.shell.silent =
      args.values.silent !== undefined
        ? !!args.values.silent
        : opt.shell.silent;
    opt.shell.showCommands =
      args.values.commands !== undefined
        ? !!args.values.commands
        : opt.shell.showCommands;

    shell.init(opt.shell);

    opt.log.logFilePath = args.values.logFilePath || opt.log.logFilePath;
    opt.log.stdoutLevel = args.values.stdoutLevel || opt.log.stdoutLevel;
    opt.log.fileLevel = args.values.fileLevel || opt.log.fileLevel;
    log.init(opt.log);
    return args;
  }
};
