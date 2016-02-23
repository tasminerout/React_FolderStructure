import React from 'react';
import styles from './_folderTree.scss';
/*
* The Folder Tree Component body
* Author : Tasmine Rout
*/
class TreeBody extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
            rawData: {},
            displayList:[],
            levelCount:1,
            inputFlag:false,
            opnList:[],
            exAll:false,
            colAll:true
      };
    }
    /*
    *** get a different new folder name each time when a folder is created
    *** holds the logic of naming folders as NewFolder,NewFolder1...
    */
    getNewFolderObject(arr,data){
        var name='', folderName='NewFolder';
        arr.map(function(_data){
            if(_data.folderName.indexOf('NewFolder')>-1){
                name=_data.folderName;
            }
        });
        if(name !=='NewFolder' && name !==''){ 
            folderName+=(parseInt(name.split("NewFolder")[1])+1);
        }
        else if(name === 'NewFolder'){
            folderName='NewFolder1';
        }
        return {folderName: folderName,level : data.level+1,_on:false,child: [], editable:true,type:'folder'}
    }
     /*
    *** get a different new File name each time when a folder is created
    *** holds the logic of naming file as NewFile,NewFile1...
    */
    getNewFileObject(arr,data){
        var name='', folderName='NewFile';
        arr.map(function(_data){
            if(_data.folderName.indexOf('NewFile')>-1){
                name=_data.folderName;
            }
        });
        if(name !=='NewFile' && name !==''){ 
            folderName+=(parseInt(name.split("NewFile")[1])+1);
        }
        else if(name === 'NewFile'){
            folderName='NewFile1';
        }
        return {folderName: folderName,level : data.level+1,_on:false,child: [], editable:true,type:'file'}
    }
    /*
    * Iterates over the data from db (main json data) creates a array which is being used to render the UI
    * maintains two different arrays ie. one for disply(displayList) and other one is the main data array 
    *takes care of expand all and collapse all logic by inserting a key "_on" which tells react ehich one to show on UI and which one to hide, 
    *that makes the component completely data driven with out any kind of direct DOM manipulation
    */
    createMyList(data,_pre){
        var _this=this,cLen=0;
        data.map(function(i){
            cLen=0;
            i.child.map(function(data){
                if(data.folderName){
                    cLen++;
                }
            });
            _this.state.displayList.push({child:cLen,folder:i.folderName,level:i.level, _on:i._on, editable:i.editable,rel:_pre+'/'+i.folderName,type:i.type});
            if(_this.state.exAll){
                i._on =true;
            }
            if(_this.state.colAll){
                i._on =false;
            }
            if(i._on){
                 _this.createMyList(i.child,_pre+'/'+i.folderName); // recursive call to iterate over the nested data structure 
            }
        });
    }
    /*
    *function for show/hide Folders/Files
    */
    clickHandler(data,slf){
        var changed={val:false};
        slf.state.levelCount=1;
         slf.state.colAll=false;
         slf.state.exAll=false;
        slf.__changeData(slf.state.rawData,data.rel.split('/'),changed,slf);
        slf.forceUpdate();
    }
    /*
    * logic for show/hide Folders/Files 
    * Iterates over the main data array and set the display key (_on) to true( display on) or false(display off)
    */
    __changeData(rawData,chk,changed,slf){
            var __limit=chk.length-1;

            for(var i=0; i<rawData.length; i++)
            {
                if(rawData[i]){
                    if(slf.state.levelCount!==__limit && rawData[i].folderName===chk[slf.state.levelCount]){
                            slf.state.levelCount++;
                            slf.__changeData(rawData[i].child,chk,changed,slf);                    
                    }else{
                        if(rawData[i].folderName===chk[__limit] && !changed.val){
                            rawData[i]._on=rawData[i]._on===true?false:true;
                            changed.val=true;
                            return;
                        }
                    }
                }
            }
    }
    /*
    *** Handler method for all insert/ update/ delete operation
    */
    folderOPN(_,enVal){
        var data=_.data,opFlag=_.flag,slf=_.slf;
        var pathObj={},pathArr=[];
        var count=0, complete={val:true};
        if(opFlag==='I' || opFlag==='iF' || data.editable || opFlag==='D'){         
         slf.state.colAll=false;
         slf.state.exAll=false;
           slf.folderService(slf.state.rawData,data.rel.split('/').splice(1),count,data,opFlag,complete,enVal,data.type,slf);
        }
        slf.forceUpdate();
    }
    /*
    *** Service method for insert/ update/ delete 
    ***perform the operation over the main data array
    *** trigger the call backs accrodingly
    */
    folderService(rawData,pathArr,count,data,opFlag,complete,enVal,type,slf){
        var fName;
        for(var i=0; i<rawData.length; i++)
        {
            if(rawData[i] && rawData[i].folderName===pathArr[count] && complete.val){
                if(count===pathArr.length-1){
                    if(type===rawData[i].type){
                        if(opFlag==='I' || opFlag==='iF'){
                            fName=opFlag==='I'?slf.getNewFolderObject(rawData[i].child,data):slf.getNewFileObject(rawData[i].child,data);
                            rawData[i].child.push(fName);
                            slf.state.opnList.push({rel:data.rel+'/'+fName.folderName,opn:"I",type:opFlag==='iF'?'file':'folder'});
                            rawData[i]._on=true;
                            complete.val=false;
                            if(slf.props.insertCallback){
                                slf.props.insertCallback({rel:data.rel+'/'+fName.folderName,opn:"I",type:opFlag==='iF'?'file':'folder'});
                            }else{
                                alert("ERROR :: No insertcallBack found");
                            }
                            return;
                        }else if(opFlag==='D'){
                            slf.state.opnList.push({rel:data.rel,opn:"D",type:type});
                            delete(rawData[i]);  
                            if(slf.props.deleteCallback){                      
                                slf.props.deleteCallback({rel:data.rel,opn:"D",type:type});
                            }else{
                                alert("ERROR :: No delete callback found")
                            }
                            complete.val=false;
                            return;
                        }else{
                            var repl='';
                            slf.state.opnList.push({prevName:data.rel,opn:"U",newName:enVal,type:type});
                            rawData[i].folderName=enVal;
                            if(slf.props.updateCallback){
                                slf.props.updateCallback({prevName:data.rel,opn:"U",newName:enVal,type:type});
                            }else{
                                alert("ERROR :: No update callback found");
                            }
                            complete.val=false;
                            return;
                        }
                    }
                }else{
                    count++;
                    slf.folderService(rawData[i].child,pathArr,count,data,opFlag,complete,enVal,type,slf);
                }
            }
        }   
    }
    /*
    *** display input box 
    */
    showInputBox(data,slf){
        if(data.editable){
            slf.state.displayList.map(function(i){
                if(i.rel===data.rel){
                    i.showInp=true;
                }
            });
            slf.setState({inputFlag:true});
        }else{
            alert("Not allowed");
        }
    }
    /*
    *** Data entry handler for folder/file name update operation
    */
    enterData(data,slf,e){
        if(e.keyCode===13){
            var enVal=slf.refs['_ref:'+data.folder].getDOMNode().value;
            if(data.type==='folder'?slf.props.folderNameValidator?slf.props.folderNameValidator(enVal):true:slf.props.fileNameValidator?slf.props.fileNameValidator(enVal):true){
                if(slf.findSiblings(data,enVal)){
                    slf.folderOPN({data:data,flag:'U',slf:slf},enVal);
                }else{
                    alert("name exist");
                }
            }else{
                alert("Name can contain only a conbination of alphabets, numbers, period, hyphens or underscore");
            }
        }
    }
    /*
    ***finds if there exists another folder/file with the same name inside the same parent
    */
    findSiblings(data,enVal){
        var _list=this.state.displayList;
        var obj=[];
        var _data=data.rel.slice(0,data.rel.lastIndexOf('/'));
        for(var i=0; i<_list.length; i++){
            if(_list[i].rel.slice(0,_list[i].rel.lastIndexOf('/'))===_data && _list[i].rel!==data.rel && _list[i].type===data.type){
                    obj.push(_list[i].folder);
                }
        }
        if(obj.length===1 && obj[0]===enVal){
            return false;
        }
        else if(obj.indexOf(enVal)>-1){
            return false;
        }else{
            return true;
        }
    }
    /*
    *** Expand all handler
    */
    expandAll=()=>{
        this.setState(
            {
               exAll:true,
                colAll :false
            });
    }
    /*
    ***Collapse all handler
    */
    collapseAll=()=>{
         this.setState(
            {
               exAll:false,
                colAll :true
            });
    }
    render(){
        console.log("Styles",styles);
        this.state.rawData= this.props.folderData;       
        var _this=this;
        if(this.state.inputFlag){
            this.state.inputFlag=false;
        }else{
            this.state.displayList=[];
           this.createMyList(this.state.rawData,'');
        }
        var _template= this.state.displayList.map(function(data,index){
            var separater=[];
            for(var i=0; i<data.level; i++){
                separater.push(<span className={styles.ft_separater}></span>);
            }
            return <div>
                        <div className={styles.ft_fname}>
                            {separater}
                            {(data.child>0)?<span className={(data._on || _this.state.exAll) && !_this.state.colAll? styles.ft_collButton:styles.ft_expButton}  onClick={_this.clickHandler.bind(null, data,_this)}></span>:<span className={styles.ft_blank}></span>}
                            <span className={data.type==='folder'?'ft_folderIcon':'ft_fileIcon'}></span>
                            {data.showInp?<input type='text' ref={'_ref:'+data.folder} className={styles.ft_textBox} onKeyDown={_this.enterData.bind(null, data, _this)}/>:<span className={styles.ft_text} onDoubleClick={_this.showInputBox.bind(null, data,_this)}>{data.folder}</span>}

                            {data.type==='folder'?<span className={styles.ft_addButton} onClick={_this.folderOPN.bind(null, {data:data,flag:'I',slf:_this})}></span>:null}
                            {data.type==='folder'?<span className={styles.ft_addfileButton} onClick={_this.folderOPN.bind(null, {data:data,flag:'iF',slf:_this})}></span>:null}
                            {data.editable?<span className={styles.ft_deleteButton} onClick={_this.folderOPN.bind(null,{data:data,flag:'D',slf:_this})}></span>:null}
                        </div>
                        <div className={styles.clr}></div>
                    </div>
        }); 
      return(
            <div className = {styles.folderExplorerContainer}>
                {this.props.showExColButton?<div>
                    <input type='button' onClick={this.expandAll} disabled={this.state.exAll} className={this.state.exAll?styles.disabledButton:''} value="Expand All"/>
                    <input type='button' onClick={this.collapseAll} disabled={this.state.colAll} className={this.state.colAll?styles.disabledButton:''} value="Collapse All"/>
                </div>:null}
                <div className={styles.ft_container}>
                    {_template}
                </div>
                
            </div>
        );
    }
}
export default TreeBody;