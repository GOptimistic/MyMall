var express = require('express');
var router = express.Router();
var User = require('./../models/user')
require('./../util/util')
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post("/login",function(req,res,next){  //登入接口
  var param = {
    userName:req.body.userName,
    userPwd:req.body.userPwd
  }
  User.findOne(param,function(err,doc){
    if(err){
      res.json({
        status:'1',
        msg:err.message
      });
    }else{
      if(doc){
        res.cookie("userId",doc.userId,{
          path:'/',
          maxAge:1000*60*60
        });
        res.cookie("userName",doc.userName,{
          path:'/',
          maxAge:1000*60*60
        });
        //req.session.user = doc;
        res.json({
          status:'0',
          msg:'',
          result:{
            userName:doc.userName
          }
        });
      }else{
        res.json({
          status:'1',
          msg:'用户名密码有误',
          result:{
            userName:''
          }
        })
      }
    }
  })
});

router.post("/logout",function(req,res,next){ //登出的路由
  res.cookie("userId","",{  //清除cookie
    path:"/",
    maxAge:-1
  });
  res.cookie("userName","",{  //清除cookie
    path:"/",
    maxAge:-1
  });
  res.json({
    status:"0",
    msg:'',
    result:''
  });
});
router.get("/checkLogin",function(req,res,next){
  if(req.cookies.userId){
    res.json({
      status:'0',
      msg:'',
      result:req.cookies.userName ||''
    });
  }else{
    res.json({
      status:'1',
      msg:'未登录',
      result:''
    });
  }
});

router.get("/cartList",function(req,res,next){  //查询当前用户的购物车数据
  var userId = req.cookies.userId;
  User.findOne({userId:userId},function(err,doc){
    if(err){
      res.json({
        status:'1',
        msg:err.message,
        result:''
      });
    }else{
      if(doc){
        res.json({
          status:'0',
          msg:'',
          result:doc.cartList
        });
      }
    }
  });
});

router.post("/cartDel",function(req,res,next){ //删除购物车数据
  var userId = req.cookies.userId,productId = req.body.productId;
  User.update({
    userId:userId //条件
  },{
    $pull:{ 
      'cartList':{'productId':productId}
    }
  },function(err,doc){
    if(err){
      res.json({
        status:'1',
        msg:err.message,
        result:''
      });
    }else{
      res.json({
        status:'0',
        msg:'',
        result:'suc'
      });
    }
  });
});

router.post("/cartEdit",function(req,res,next){ //编辑购物车商品数量的接口
  var userId = req.cookies.userId;
  var productId = req.body.productId;
  var productNum = req.body.productNum;
  var checked = req.body.checked;
  User.update({"userId":userId,"cartList.productId":productId},{
    "cartList.$.productNum":productNum,
    "cartList.$.checked":checked
  },function(err,doc){
    if(err){
      res.json({
        status:'1',
        msg:err.message,
        result:''
      });
    }else{
      res.json({
        status:'0',
        msg:'',
        result:'suc'
      });
    }
  });
});

router.post("/editCheckAll",function(req,res,next){ //全部选中的接口
  var userId = req.cookies.userId;
  var checkAll = req.body.checkAll?'1':'0';
  User.findOne({"userId":userId},function(err,user){
    if(err){
      res.json({
        status:'1',
        msg:err.message,
        result:''
      });
    }else{
      if(user){ //拿到用户数据了
        user.cartList.forEach( (item) => {
          item.checked = checkAll;
        });
        user.save(function(err1,doc){
          if(err1){
            res.json({
              status:'1',
              msg:err1.message,
              result:''
            });
          }else{
            res.json({
              status:'0',
              msg:'',
              result:'suc'
            });
          }
        })
      }
      
    }
  })
});

router.get("/addressList",function(req,res,next){ //获取地址列表的接口
  var userId = req.cookies.userId;
  User.findOne({userId:userId},function(err,doc){
    if(err){
      res.json({
        status:'1',
        msg:err.message,
        result:''
      });
    }else{
      res.json({
        status:'0',
        msg:'',
        result:doc.addressList
      });
    }
  })
});

router.post("/setDefault",function(req,res,next){ //设置默认地址的接口
  var userId = req.cookies.userId;
  var addressId = req.body.addressId;
  if(!addressId){
    res.json({
      status:'1003',
      msg:'addressId is null',
      result:''
    });
  }
  User.findOne({"userId":userId},function(err,doc){
    if(err){
      res.json({
        status:'1',
        msg:err.message,
        result:''
      });
    }else{
        addressList = doc.addressList;
        addressList.forEach((item)=>{
          if(item.addressId==addressId){
            item.isDefault = true;
          }else{
            item.isDefault = false;
          }
        });
        doc.save(function(err1,doc1){
          if(err1){
            res.json({
              status:'1',
              msg:err1.message,
              result:''
            });
          }else{
            res.json({
              status:'0',
              msg:'',
              result:''
            });
          }
        });
    }
  })
});

router.post("/delAddress",function(req,res,next){ //删除地址
  var userId = req.cookies.userId;
  var addressId = req.body.addressId;
  User.update({
    userId:userId //条件
  },{
    $pull:{ //要删除的子文档的元素
      'addressList':{'addressId':addressId}
    }
  },function(err,doc){
    if(err){
      res.json({
        status:'1',
        msg:err.message,
        result:''
      });
    }else{
      res.json({
        status:'0',
        msg:'',
        result:'suc'
      });
    }
  });
})

router.post("/payMent",function(req,res,next){ //生成订单
  var userId = req.cookies.userId;
  var addressId = req.body.addressId;
  var orderTotal = req.body.orderTotal;
  User.findOne({"userId":userId},function(err,doc){
    if(err){
      res.json({
        status:'1',
        msg:err.message,
        result:''
      });
    }else{
      var address = '';
      var goodsList = [];
      doc.addressList.forEach((item)=>{ //获取当前用户的地址信息
        if(addressId==item.addressId){
          address = item;
        }
      });
      doc.cartList.filter((item)=>{ //获取用户购物车的商品
        if(item.checked=='1'){
          goodsList.push(item);
        }
      });

      var platform = '622';
      var r1 = Math.floor(Math.random()*10);  //0-9的随机数
      var r2 = Math.floor(Math.random()*10);  //0-9的随机数
      var sysDate = new Date().Format('yyyyMMddhhmmss');
      var createDate = new Date().Format('yyyy-MM-dd hh:mm:ss');  //订单创建时间
      var orderId = platform+r1+sysDate+r2; //19位数字
      var order = {
        orderId:orderId,
        orderTotal:orderTotal,
        addressInfo:address,
        goodsList:goodsList,
        orderStatus:'1',
        createData:createDate
      };
      
      doc.orderList.push(order);
      doc.save(function(err1,doc1){
        if(err1){
           res.json({
            status:'1',
            msg:err1.message,
            result:''
          });
        }else{
           res.json({
            status:'0',
            msg:'',
            result:{
              orderId:order.orderId,
              orderTotal:order.orderTotal,
            }
          });
        }
      });
      
      }
    });
});

router.get("/orderDetail",function(req,res,next){ //获取订单详情
  var userId = req.cookies.userId;
  var orderId = req.param("orderId");
  var orderTotal = 0;
  User.findOne({userId:userId},function(err,userInfo){
    if(err){
      res.json({
        status:'1',
        msg:err.message,
        result:''
      });
    }else{
      var orderList = userInfo.orderList;
      if(orderList.length>0){
          orderList.forEach((item)=>{
            if(item.orderId == orderId){
              orderTotal = item.orderTotal;
            }
          });
          if(orderTotal>0){
            res.json({
              status:'0',
              msg:'',
              result:{
                orderId:orderId,
                orderTotal:orderTotal
              }
            });
          }else{
            res.json({
              status:'120002',
              msg:'无此订单',
              result:''
            });
          }
      }else{
        res.json({
          status:'120001',
          msg:'当前用户无订单',
          result:''
        });
      }
    }
  })
});

router.get("/getCartCount",function(req,res,next){ //获取购物车数量
  if(req.cookies && req.cookies.userId){
    var userId = req.cookies.userId;
  User.findOne({userId:userId},function(err,doc){
    if(err){
      res.json({
        status:'1',
        msg:err.message,
        result:''
      });
    }else{
      var cartList = doc.cartList;
      var cartCount = 0;
      cartList.map(function(item){
        cartCount+= parseInt(item.productNum); 
      });
      res.json({
        status:'0',
        msg:'',
        result:cartCount
      });
    }
  })
  }
});
module.exports = router;
