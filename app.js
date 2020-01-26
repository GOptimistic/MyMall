var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var goodsRouter = require('./routes/goods');


var app = express();  //express框架

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade'); //模板引擎

//插入中间件
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req,res,next){
    if(req.cookies.userId){ //如果cookie有的话说明是登陆了的
      next(); //登录了的话就往后走
    }else{  //没有登录
      if(req.originalUrl == '/users/login'||req.originalUrl == '/users/logout'||req.originalUrl.indexOf('/goods/list')>-1 ){
        //对登录登出以及请求商品列表的接口设置白名单
        next();
      }else{  //其余接口一律阻截
        res.json({
          status:'10001',
          msg:'当前未登录',
          result:''
        });
      }
    }
});
//设置路由
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/goods', goodsRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
