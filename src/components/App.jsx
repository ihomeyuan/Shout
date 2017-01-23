/**

The main component with the app's actions and 'store.'

**/

import React from 'react';
import CSSTransitionGroup from 'react-addons-css-transition-group';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import AppBar from 'material-ui/AppBar';
import Paper from 'material-ui/Paper';
import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';
import Drawer from 'material-ui/Drawer';

import NavigationChevronLeft from 'material-ui/svg-icons/navigation/chevron-left';
import NavigationMenu from 'material-ui/svg-icons/navigation/menu';

//import other components & pages
import Search from './Search.jsx';
import SearchInputs from './SearchInputs.jsx';
import Footer from './Footer.jsx';
import LeftMenu from './LeftMenu.jsx';
import ClinicPage from './ClinicPage.jsx';
import AddResource from './AddResource.jsx';
import About from './About.jsx';

import PouchDB from 'pouchdb';
import PouchDBQuickSearch from 'pouchdb-quick-search';

PouchDB.plugin(PouchDBQuickSearch);

var db = new PouchDB('resourcesnew');
var remoteCouch = 'https://generaluser:pass@shout.zooid.org:6984/resourcesnew';

//declare the remote DB's that store tentative user feedbacks for moderation
var pendingDB = 'https://generaluser:pass@shout.zooid.org:6984/resourcespending';

PouchDB.sync('db', 'remoteCouch');

// all of the CSS styles for this component defined here
const styles = {

  appbar: {
    minHeight:100
  },

  appbarTitle:{
   paddingTop:5,
   color:'#ffffff',
   fontSize:30,
  },

  appbarSubtitle: {
    paddingTop:13,
    fontSize: 15,
    color:'#ffffff',
    marginLeft:10
  },

  search:{
    paddingTop:5,
    width:'60%'
  },

  stylemenu:{
      position: 'fixed',
      height: '100%',
  },

  row: {
      display: 'flex',
      flexDirection: 'row'
  },
  column: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%'
  },

};

//begin Component definition

export default class App extends React.Component {

  constructor () {
    super();

    // this component's state acts as the overall store for now
    this.state = {
        allResources: [],
        filteredResources: [],
        showMenu: false,
        searchString: '',
        appbarState: false,
        selectedFooterIndex: 0,
        appbarTitle: 'Shout',
        appbarSubtitle: 'Find Accessible Healthcare.',
        appbarIcon: <NavigationMenu />,
        searchBar: "",
        hoveredMapRowIndex: '-1',
        userLat: '33.7490',
        userLng: '-84.3880',

        clinicpageTags:[],
        clinicpageFeedbacks:[]
    };


  }

  addFlag(flag, result){

    console.log("added flag");
  }

  addSingleTag(label, tagsdoc){

    var tag={
    value:label,
    count:1
    }

    tagsdoc.tags.push(tag);
    db.put({
            _id:tagsdoc._id,
            _rev:tagsdoc._rev,
            type:"tag",
            tags:tagsdoc.tags,
        }, function(err, response) {
          if (err) { return console.log(err); }
          console.log("success");
        });
  }

  
  // Add a resource to the collection
  addResource (res) {

      //calculate latitude and longitude


          //create json object
          var resource = {
              _id: "Resource"+"_"+res.zip+"_"+res.name,
              type: "resource",
              name: res.name,
              lat: res.lat,
              lng: res.lng,
              civic_address:res.civic_address,
              phone:res.phone,
              website:res.website,
              description: res.description,
              resourcetype: res.type,
              services: res.services,
              zip:res.zip

          };
          db.put(resource, function callback(err, result) {
              if (!err) {
                  console.log('Added resource');
              }
              else{
              console.log('Error putting'+err);
              }
          });

          this.addTags(res.tags, res.name);

          PouchDB.sync('db', 'remoteCouch');

          this.filterResources(this.state.searchString);

  }

  addFeedback (rev){

    var review = {
        _id: "Feedback"+"_"+rev.name+"_"+new Date().toISOString(),
        type: "feedback",
        name: rev.name,
        author: rev.author,
        accessibility:rev.accessibility,
        quality:rev.quality,
        affordability:rev.affordability,
        text: rev.text,

    };

    db.put(review, function callback(err, result) {
        if (!err) {
            console.log('Added review');
        }
    });

    this.filterResources(this.state.searchString);

  }

  addTags(tags, res_name) {

  const tagsarr=[]

    tags.forEach(function(element) {

                    var tag = {
                        value: element.label,
                        count: 1

                    };
                    tagsarr.push(tag);

      });

      var tagsobj={
        _id: "tags"+"_"+res_name,
        type: "tag",
        tags:tagsarr,
      }

      db.put(tagsobj, function callback(err, result) {
          if (err) {
              return console.log(err);
          }
      });

    if (remoteCouch) {
        this.sync();
    }

  }


  // onClick function for toggling menu state
  appbarClick () {
       if (!this.state.appbarState) {
           this.setState({showMenu: !this.state.showMenu});
       } else {
          this.displaySearch();
       }

    }


  componentDidMount () {
    if (remoteCouch) {
        this.sync();
    }
    this.displaySearch();
  }
    // these are the app's actions, passed to and called by other components

  displayAddResource() {
    this.setState({appbarIcon:<NavigationChevronLeft />});
    this.setState({appbarTitle:"Add Resource"});
    this.setState({appbarSubtitle:' '});
    this.setState({appbarState:true});
    this.setState({showMenu: false});
    this.setState({screen: <AddResource container={this.refs.content} footer={this.refs.footer} displaySearch={(result) => this.displaySearch()} addResource={(x) => this.addResource(x)} getGeocoder={()=>this.state.geocoder} displaySearch={()=>this.displaySearch}/>});
  }

  displayResult (result) {
    const clinicname=result.name;
    this.setState({appbarIcon:<NavigationChevronLeft />});

    this.updatePageTags(result.name);
    this.updateFeedbacks(result.name);
    this.setState({searchBar:""});
    this.setState({appbarTitle:clinicname});
    this.setState({appbarSubtitle:' '});
    this.setState({searchBar: ""});
    this.setState({searchBar: ""});
    this.setState({appbarState:true});
    this.setState({screen: <ClinicPage container={this.refs.content} footer={this.refs.footer} displaySearch={(result) => this.displaySearch()} addTags={(tags, res_name)=>this.addTags(tags,res_name)} addFeedback={(x) => this.addFeedback(x)} getTags={() => this.state.clinicpageTags} getFeedbacks={()=>this.state.clinicpageFeedbacks} result={result} vouchFor={(a,b,c)=>this.vouchFor(a,b,c)} vouchAgainst={(a,b,c)=>this.vouchAgainst(a,b,c)} addSingleTag={(a,b)=>this.addSingleTag(a,b)} addFlag={()=>this.addFlag(a,b)}/>});
  }


  displaySearch () {
    db.allDocs({startkey : 'Resource_', endkey : 'Resource_\uffff', include_docs: true}, (err, doc) => {
            if (err) { return console.log(err); }
            this.redrawResources(doc.rows);
        });
    this.setState({screen: <Search container={this.refs.content} footer={this.refs.footer} displayResult={(result) => this.displayResult(result)} filterResources={(string) => this.filterResources(string)} getTags={(name) => this.state.clinicpageTags} searchString={this.state.searchString} displayAddResource={() => this.displayAddResource()} getFilteredResources={() => this.state.filteredResources} onGoogleApiLoad={(map, maps) => this.onGoogleApiLoad(map, maps)} userLat={this.state.userLat} userLng={this.state.userLng} />});
    this.setState({appbarTitle:'Shout'});
    this.setState({appbarSubtitle:'Find Accessible Healthcare.'});
    this.setState({appbarState:false});
    this.setState({searchBar: <SearchInputs filterResources={(searchString)=>this.filterResources(searchString)} searchString={this.state.searchString}/>});
    this.setState({appbarIcon:<NavigationMenu />});
    this.requestCurrentPosition();


}


filterResources (searchString) {

  if (!searchString || searchString.length < 1) {
    this.setState({filteredResources:this.state.allResources});
  }else{
    db.search({
      query: searchString,
      fields: ['name', 'description','_id','text'],
      include_docs: true
      },(err,list)=>{

        if(err){return console.log(err);}

        var matches= {
            results: []
        };

          list.rows.forEach(function (res) {
              if(res.id.startsWith('Tag')){
                console.log("started with tag");
                matches.results.push(res);
              }
              else if(res.id.startsWith('Resource')){
                matches.results.push(res);
              }
              else{
                console.log("started with neither");
              }
          });
          this.redrawFilteredResources(matches.results);

      });
    }

  }

  error(err) {
    console.warn('ERROR(' + err.code + '): ' + err.message);
  }

  /*Change the selected bottom navigation index (this function is passed as a prop to the footer)*/
  footerSelect(index) {
      this.setState({selectedFooterIndex: index});
      if(index===0) {
        this.filterResources('');
      } else if(index===1){
        this.filterResources('children');
      }else if(index===2){
        this.filterResources('mental health');
      }else if(index===3){
        this.filterResources('pregnancy');
      }else if(index===4){
        this.filterNearMe();
      }
  }

  filterNearMe(){

    var arr=this.state.allResources;
    console.log(arr);
    arr.sort((a, b)=>{
        if(a.lat&&b.lat){

        var y_distance=69*Math.pow((a.lat-this.state.userLat),2);
        var x_distance=69*Math.pow((this.state.userLng-a.lng),2);
        var a_distance=Math.round(100*Math.sqrt(x_distance+y_distance))/100;

        y_distance=69*Math.pow((b.lat-this.state.userLat),2);
        x_distance=69*Math.pow((this.state.userLng-b.lng),2);
        var b_distance=Math.round(100*Math.sqrt(x_distance+y_distance))/100;

        return (a_distance-b_distance);
        }
        else return 0;
    });

      this.setState({filteredResources:arr});
  }

  hoverTableRow(index) {
       hoveredMapRowIndex: 'index';
  }

  onGoogleApiLoad(map, maps){

    var geo = new google.maps.Geocoder();
    this.setState({geocoder:geo});
    this.setState({googlemap:map});
    this.setState({googlemaps:maps});

  }

  redrawResources(resources){

        var resourcesdocs = {
            results: []
        };
        resources.forEach(function (res) {
            resourcesdocs.results.push(res.doc);
        });

        this.setState({allResources:resourcesdocs.results});
        this.setState({filteredResources:resourcesdocs.results});
    }

    redrawFilteredResources(resources){

          var resourcesdocs = {
              results: []
          };
          resources.forEach(function (res) {
              resourcesdocs.results.push(res.doc);
          });

          this.setState({filteredResources:resourcesdocs.results});
      }


  requestCurrentPosition(){
      var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }

      if (navigator.geolocation)
      {
        navigator.geolocation.getCurrentPosition((pos)=>{
                                                      var crd=pos.coords;
                                                      const x=crd.latitude;
                                                      const y=crd.longitude;
                                                      this.setState({userLat:x});
                                                      this.setState({userLng:y});
                                                      }, this.error, options);
      }
  }

  syncError() {
     console.log('data-sync-state: error');
  }

  sync() {

      var opts = { live: true };
      db.replicate.to(remoteCouch, opts, this.syncError);
      db.replicate.from(remoteCouch, opts, this.syncError);
  }

  updatePageTags(name){

    db.allDocs({startkey : 'tags_'+name, endkey : 'tags_'+name+'_\uffff', include_docs: true}, (err, doc) => {

        if (err) { return console.log(err); }

        var tags=[];
        doc.rows.forEach(function(result){

          tags.push(result.doc);
        });
          if(tags.length>0){
            this.setState({clinicpageTags:tags[0]});
          }
          else{
            this.setState({clinicpageTags:[{value:'No tags yet', count:''}]});
          }
    });

  }

  updateFeedbacks(name){


      db.allDocs({startkey : 'Feedback_'+name, endkey : 'Feedback_'+name+'_\uffff', include_docs: true}, (err, doc) => {

          if (err) { return console.log(err); }

          var feedbacks=[];

          doc.rows.forEach(function(feedback){
            feedbacks.push(feedback.doc);
          });
          this.setState({clinicpageFeedbacks:feedbacks});
      });

  }

  vouchFor(tagsdoc, index){

      var tag=tagsdoc.tags[index];

      var modified_tag={
          value:tag.value,
          count:tag.count+1,
      };
      tagsdoc.tags[index]=modified_tag;

      db.put({
          _id:tagsdoc._id,
          _rev:tagsdoc._rev,
          type:"tag",
          tags:tagsdoc.tags,
      }, function(err, response) {
        if (err) { return console.log(err); }
        console.log("success");
      });
    }

    vouchAgainst(tagsdoc, index){

    var tag=tagsdoc.tags[index];

    if(tag.count>0){
        var modified_tag={
            value:tag.value,
            count:tag.count-1,
        };
        tagsdoc.tags[index]=modified_tag;

        db.put({
            _id:tagsdoc._id,
            _rev:tagsdoc._rev,
            type:"tag",
            tags:tagsdoc.tags,
        }, function(err, response) {
          if (err) { return console.log(err); }
          console.log("success");
        });
    }
    else{
      tagsdoc.tags.splice(index,1);

      db.put({
          _id:tagsdoc._id,
          _rev:tagsdoc._rev,
          type:"tag",
          tags:tagsdoc.tags,
      }, function(err, response) {
        if (err) { return console.log(err); }
        console.log("success");
      });

    }

    }
// end of actions

//sync the database


render () {

const { main } = this.props

db.changes({
  limit: 30,
  since: 0
}, function (err, response) {
  if (err) { return console.log(err); }
    ()=>this.redrawResources(doc.rows);
});

    return (
      <MuiThemeProvider muiTheme={getMuiTheme()}>
        <div id='wrapper'>

          <div id='header'>
              <AppBar iconElementLeft={<IconButton>{this.state.appbarIcon}</IconButton>} onLeftIconButtonTouchTap={() => this.appbarClick()}
              titleStyle={styles.appbar}>
              <div style={styles.column}>
              <div style={styles.row}>
                <div style={styles.appbarTitle}>{this.state.appbarTitle}</div>
                <div style={styles.appbarSubtitle}>{this.state.appbarSubtitle}</div>
              </div>
              <div styles={styles.search}>
                {this.state.searchBar}
              </div>
            </div>
          </AppBar>
          </div>


          <div ref='content' id='content'>
          <CSSTransitionGroup transitionName='slide' transitionEnterTimeout={ 200 } transitionLeaveTimeout={ 300 }>
            {this.state.screen}
          </CSSTransitionGroup>
          </div>

          <div id='menu'>
             <Drawer
             open={this.state.showMenu}
             style={styles.stylemenu}
             docked={false}
             onRequestChange={(showMenu) => this.setState({showMenu})}>
               <LeftMenu displayAddResource={() => this.displayAddResource()} displayAbout={() => this.displayAbout()} addResource={(res)=>this.addResource(res)}/>
            </Drawer>
         </div>


          <div ref='footer' id='footer'>
            <Footer selectedIndex={this.state.selectedFooterIndex} onSelect={(index) => this.footerSelect(index)}/>
          </div>

        </div>
      </MuiThemeProvider>

    );
  }
}
