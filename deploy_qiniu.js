const qiniu = require('qiniu');
const glob = require('glob');
const path = require('path');
const fs = require('fs');

// 从环境变量中读取七牛云配置信息
const accessKey = process.env.ACCESS_KEY;
const secretKey = process.env.SECRET_KEY;
const bucket = process.env.BUCKET_NAME;
const localFolder = './jsons'; // 需要同步的本地文件夹路径
const remoteFolder = process.env.REMOTE_FOLDER; // 七牛云目标目录

// 初始化七牛云配置
const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
const config = new qiniu.conf.Config();
config.zone = qiniu.zone.Zone_z0; // 根据实际情况选择机房
const bucketManager = new qiniu.rs.BucketManager(mac, config);

// 生成上传凭证
const options = {
  scope: bucket,
};
const putPolicy = new qiniu.rs.PutPolicy(options);
const uploadToken = putPolicy.uploadToken(mac);

// 上传文件函数
function uploadFile(localFile, remoteFile) {
  const formUploader = new qiniu.form_up.FormUploader(config);
  const putExtra = new qiniu.form_up.PutExtra();

  formUploader.putFile(uploadToken, remoteFile, localFile, putExtra, function (err, body, info) {
    if (err) {
      console.log(`上传失败：${localFile} -> ${remoteFile}`);
      console.error(err);
    } else {
      if (info.statusCode == 200) {
        console.log(`上传成功：${localFile} -> ${remoteFile}`);
      } else {
        console.log(`上传失败：${localFile} -> ${remoteFile}`);
        console.log(body);
      }
    }
  });
}

// 获取本地文件列表并上传
const files = glob.sync(`${localFolder}/**/*`, { nodir: true });

files.forEach(file => {
  const relativePath = path.relative(localFolder, file);
  const remotePath = path.join(remoteFolder, relativePath).replace(/\\/g, '/');
  uploadFile(file, remotePath);
});
