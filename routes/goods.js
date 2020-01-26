var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Goods = require('../models/goods');

mongoose.connect('mongodb://root:123456@49.232.23.19:27017/mymall');     //服务器端有密码
//mongoose.connect('mongodb://127.0.0.1:27017/mymall');

mongoose.connection.on("connected",function () {
    console.log("Mongodb connect success");
});

mongoose.connection.on("error",function () {
    console.log("Mongodb connect fail");
});

//商品列表数据获取
router.get("/list",function(req,res,next){
    var page = parseInt(req.param("page"));   //从客户端那里获得参数检测是否分页
    var pageSize = parseInt(req.param("pageSize"));
    var sort = req.param("sort");   //用于检测是否排序 
    var skip = (page-1)*pageSize;
    var priceLevel = req.param("priceLevel");
    var priceGt = '',priceLte = '';    //Gt是大于某个值，Lte是小于
    let params = {};
    if(priceLevel!='all'){
        switch (priceLevel) {
            case '0':priceGt = 0;priceLte = 100;break;
            case '1':priceGt = 100;priceLte = 500;break;
            case '2':priceGt = 500;priceLte = 1000;break;
            case '3':priceGt = 1000;priceLte = 5000;break;            
        }
        params = {
            salePrice:{
                $gt:priceGt,
                $lte:priceLte
            }
        }
    }

    var goodsModel = Goods.find(params).skip(skip).limit(pageSize); //skip是跳到第几条，limit是一页多少条
    goodsModel.sort({'salePrice':sort});
    goodsModel.exec(function (err,doc){   //以models中的goods.js里的schema为模板到数据库中去查询
        if(err){
            res.json({
                status:'1',
                msg:err.message
            });
        }else{
            res.json({
                status:'0',
                msg:'',
                result:{
                    count:doc.length,
                    list:doc
                }
            })
        }
    })
});

//加入购物车
router.post("/addCart",function(req,res,next){
    var userId = '100000077';
    var productId = req.body.productId;
    var User = require('../models/user');   //获取模型

    User.findOne({userId:userId},function(err,userDoc){
        if(err){
            res.json({
                status:"1",
                msg:err.message
            })
        }else{
            //console.log("userDoc"+userDoc);
            if(userDoc){
                let goodsItem = '';
                for(item of userDoc.cartList){
                    if(item.productId == productId){
                        goodsItem = item;
                        item.productNum = parseInt(item.productNum)+1;  //找到ID就数量++
                    }
                };
                if(goodsItem){
                    userDoc.save(function (err2,doc2){
                        if(err2){
                            res.json({
                                status:"1",
                                msg:err2.message
                            })
                        }else{
                            res.json({
                                status:'0',
                                msg:'',
                                result:'suc'
                            })
                        }
                    })
                }else{
                    Goods.findOne({productId:productId},function(err1,doc){  //从goods中查这个productId
                        if(err1){
                            res.json({
                                status:"1",
                                msg:err1.message
                            })
                        }else{
                            if(doc){
                                doc.productNum = 1;
                                doc.checked = 1;
                                userDoc.cartList.push(doc);
                                userDoc.save(function (err2,doc2){
                                    if(err2){
                                        res.json({
                                            status:"1",
                                            msg:err2.message
                                        })
                                    }else{
                                        res.json({
                                            status:'0',
                                            msg:'',
                                            result:'suc'
                                        })
                                    }
                                })
                            }
                        }
                    })
                }
                
            }
        }
    })
});

module.exports = router;