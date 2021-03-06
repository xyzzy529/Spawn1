var ScreepsAPI = require('./screeps.js')
var League = require('./league.js')
var timer = require("timer");

class Session {

  construct() {
    this.timer = false
  }

  isLoaded() {
    return(!!this.userdata && !!this.userdata.username)
  }

  loadUser() {
    this.userdata = {}
    var that = this
    var session = that
    var current_season = false
    var that = this
    if(!this.timer) {
      this.timer = timer.setInterval(() => {
        that.loadUser()
      }, 1000 * 60 * 2)
    }


    // Return promise chain

    return ScreepsAPI.whoami()

    .then(function(data){

      that.userdata.username = data.username
      that.userdata.cpu = data.cpu
      that.userdata.badge = data.badge
      that.userdata.controlpoints = Math.ceil(data.gcl)
      that.userdata.gcl = Math.ceil(ScreepsAPI.utils.controlPointsToGcl(data.gcl))

      var gcl_current_start = ScreepsAPI.utils.gclToControlPoints(that.userdata.gcl)
      var gcl_next_start = ScreepsAPI.utils.gclToControlPoints(that.userdata.gcl+1)


      that.userdata.gcl_progressTotal = Math.ceil(gcl_next_start - gcl_current_start)
      that.userdata.gcl_progress = Math.ceil(that.userdata.controlpoints - gcl_current_start)
      that.userdata.gcl_progress_percentage = Math.round((that.userdata.gcl_progress / that.userdata.gcl_progressTotal) * 100)
      that.userdata.gcl_progressTotal_string = that.userdata.gcl_progressTotal.toAbbreviated()
      that.userdata.gcl_progress_string = that.userdata.gcl_progress.toAbbreviated()

      that.userdata.power = data.power
      that.userdata.power_level = ScreepsAPI.utils.powerToLevel(data.power)
      var power_current_start = ScreepsAPI.utils.powerAtLevel(that.userdata.power_level)
      var power_next_start = ScreepsAPI.utils.powerAtLevel(that.userdata.power_level+1)

      that.userdata.power_progressTotal = Math.ceil(power_next_start - power_current_start)
      that.userdata.power_progress = Math.ceil(that.userdata.power - power_current_start)
      that.userdata.power_progress_percentage = Math.round((that.userdata.power_progress / that.userdata.power_progressTotal) * 100)
      that.userdata.power_progressTotal_string = that.userdata.power_progressTotal.toAbbreviated()
      that.userdata.power_progress_string = that.userdata.power_progress.toAbbreviated()



      that.userdata.money = (Math.round(100*data.money)/100).toFixed(2)
      that.userdata.alliance = League.getUserAlliance(data.username)

      var alliance = League.getAlliance(League.getUserAlliance(data.username))
      if(alliance) {
        that.userdata.alliance = alliance.abbreviation
        that.userdata.alliance_name = alliance.name
      }

      that.userdata.badge_url = League.getBadgeUrl(data.username)
      return ScreepsAPI.seasons()
    })

    // Set Current Season
    .then(function(data){
      var seasons = data['seasons']
      seasons.sort(function(a,b){
        a = new Date(a.dateModified);
        b = new Date(b.dateModified);
        return a>b ? -1 : a<b ? 1 : 0;
      })
      current_season = seasons[0]['_id']
      return Promise.resolve(true)
    })

    // Get and store Power Ranking
    .then(function(){
      return ScreepsAPI.find('power', current_season, that.userdata.username)
    })
    .then(function(data){
      // Rankings start at zero so add one
      that.userdata.powerRank = data.rank+1
      that.userdata.powerScore = data.score
    })

    // Get and store Control Ranking
    .then(function(){
      return ScreepsAPI.find('world', current_season, that.userdata.username)
    })
    .then(function(data){
      // Rankings start at zero so add one
      that.userdata.controlRank = data.rank+1
      that.userdata.controlScore = data.score
      return ScreepsAPI.overview(1440, 'energyControl')
    })
    .then(function(data) {
      that.userdata.rooms = data.rooms
      that.userdata.roomCount = data.rooms.length
    })

    // Process Errors
    .catch(function(err) {
      console.log(err.message)
      console.log(err.stack)
      return err
    })

  }

  clear() {
    if(this.timer) {
      timer.clearInterval(this.timer)
      this.timer = false
    }
    this.userdata = {}
    ScreepsAPI.reset()
  }

}

var current_session = new Session()

module.exports = current_session