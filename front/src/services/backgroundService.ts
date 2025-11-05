

const API_URL = "http://localhost:3000/books";
import backDirector from "../assets/LogosNBack/banner-action.jpg";
import backActor from "../assets/LogosNBack/glumaBack.jpg";
import backSnimatelj from "../assets/LogosNBack/cam2.jpg";
import backScenograd from "../assets/LogosNBack/scen3.webp";
import backEdit from "../assets/LogosNBack/eda.jpg";
import { getMAINUserRoleForMovie, getMovieById, getUserRoleForMovie } from "./movieService";
export const backgroundService = {
 
  async changeBackgroundPerMovie(token:any,movieId:any,navigate: any){
     getMAINUserRoleForMovie(token,movieId+'').then(data2 =>{
            if(data2==0)
            {
                navigate("/film");
                return
            }
            getMovieById(token,movieId).then(data=>{
                document.body.style.background = `url(http://localhost:3000${data.picture}) no-repeat center center`;
                document.body.style.backgroundSize = "cover";
                document.body.style.backgroundPosition = "center";
                document.body.style.backgroundRepeat= 'no-repeat'
                document.body.style.backgroundAttachment= 'fixed'
                document.body.style.width = "100%";
                document.body.style.height = "100%"; 
            })

    })
  },
  async changeBackgroundPerUser(token:any,movieId:any,navigate: any){
        getMAINUserRoleForMovie(token,movieId+'').then(data2 =>{
            if(data2==0)
            {
                navigate("/film");
                return
            }
            switch (data2) {
                case 1:
                    document.body.style.background = `url(${backDirector}) no-repeat center center`;
                    document.body.style.backgroundSize = "cover";
                    document.body.style.backgroundPosition = "center";
                    document.body.style.backgroundRepeat= 'no-repeat'
                    document.body.style.backgroundAttachment= 'fixed'
                    document.body.style.width = "100%";
                    document.body.style.height = "100%";
                    break;
                case 2:
                    document.body.style.background = `url(${backActor}) no-repeat center center`;
                    document.body.style.backgroundSize = "cover";
                    document.body.style.backgroundPosition = "center";
                    document.body.style.backgroundRepeat= 'no-repeat'
                    document.body.style.backgroundAttachment= 'fixed'
                    document.body.style.width = "100%";
                    document.body.style.height = "100%";
                    break;
                case 3:
                    document.body.style.background = `url(${backSnimatelj}) no-repeat center center`;
                    document.body.style.backgroundSize = "cover";
                    document.body.style.backgroundPosition = "center";
                    document.body.style.backgroundRepeat= 'no-repeat'
                    document.body.style.backgroundAttachment= 'fixed'
                    document.body.style.width = "100%";
                    document.body.style.height = "100%";
                    break;
                case 4:
                    document.body.style.background = `url(${backScenograd}) no-repeat center center`;
                    document.body.style.backgroundSize = "cover";
                    document.body.style.backgroundPosition = "center";
                    document.body.style.backgroundRepeat= 'no-repeat'
                    document.body.style.backgroundAttachment= 'fixed'
                    document.body.style.width = "100%";
                    document.body.style.height = "100%";
                    break;
                default:
                    document.body.style.background = `url(${backEdit}) no-repeat center center`;
                    document.body.style.backgroundSize = "cover";
                    document.body.style.backgroundPosition = "center";
                    document.body.style.backgroundRepeat= 'no-repeat'
                    document.body.style.backgroundAttachment= 'fixed'
                    document.body.style.width = "100%";
                    document.body.style.height = "100%";
        }})
    
  },
  
  async changeBackground(picture:any) {
    document.body.style.background = `url(${picture}) no-repeat center center`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat= 'no-repeat'
    document.body.style.backgroundAttachment= 'fixed'
    document.body.style.width = "100%";
    document.body.style.height = "100%";


  },

  async cleanBackground(){
    document.body.style.background = "";
    document.body.style.backgroundSize = "";
    document.body.style.backgroundPosition = "";
    document.body.style.width = "";
    document.body.style.height = "";
  }

};
