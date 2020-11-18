const { prompt } = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');
const path = require('path');
const tplPath = path.resolve(__dirname, '../template.json');
const tplJson = require(tplPath);
const rm = require('rimraf').sync;
const exec = require('child_process').exec;
const Metalsmith = require('metalsmith');
const Handlebars = require('handlebars');
const bufferFrom = require('buffer-from')

const questions = [
  {
    type: 'input',
    name: 'template',
    message: '模板名称',
    default: 'sjk',
    validate: function (val) {
      if (!val) {
        return '模板名称不为空';
      } else {
        return true;
      }
    },
  },
  {
    type: 'input',
    name: 'templateType',
    message: '模板类型',
    default: 'component',
    validate: function (val) {
      if (!val) {
        return '模板类型不为空';
      } else {
        return true;
      }
    },
  },
  {
    type: 'input',
    name: 'projectName',
    message: '项目名称',
    validate: function (val) {
      if (!val) {
        return '项目名称不为空';
      } else {
        return true;
      }
    },
  },
  {
    type: 'input',
    name: 'projectDesc',
    message: '项目描述',
  },
];

function run(data) {
  const { projectName, template, templateType } = data;
  console.log(chalk.yellow(`使用模板${template}创建项目`));
  const spinner = ora('正在下载模板');
  spinner.start();
  exec(`npm i ${tplJson[template].npm}`, (err, res) => {
    spinner.stop();
    process.on('exit', () => {
      console.log('exit');
      // 完成后删除下载的模板文件
      rm(`${process.cwd()}/node_modules`);
      rm(`${process.cwd()}/package-lock.json`);
    });
    if (err) {
      console.log(chalk.red('模板下载失败 ', err.message));
      return;
    }
    const tplPath = `${process.cwd()}/node_modules/${tplJson[template].npm}`;
    const projectPath = `${process.cwd()}/${projectName}`;
    console.log(projectPath);
    Metalsmith(`${tplPath}/template/${templateType}`)
      .metadata(data)
      .source('.')
      .destination(`${projectPath}`)
      .use((files, metalsmith, done) => {
        Object.keys(files).forEach((fileName) => {
          //遍历替换模板
          if (!fileName.startsWith('src/font')) {
            //判断是否为字体文件，字体文件不用替换
            const fileContentsString = files[fileName].contents.toString(); //Handlebar compile 前需要转换为字符创
            files[fileName].contents = bufferFrom(Handlebars.compile(fileContentsString)(metalsmith.metadata()));
          }
        });
        done();
      })
      .build(function (err) {
        if (err) {
          console.log(chalk.red('项目生成失败', err));
        }
        console.log(chalk.yellow(' \n 项目已创建'));
      });
  });
}

module.exports = function () {
  prompt(questions).then(function (data) {
    const { template } = data;
    if (!tplJson[template]) {
      console.log(chalk.red(`template.json里没有${template}的模板信息，请添加！`));
      return;
    }
    run(data);
  });
};
