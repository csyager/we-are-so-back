import { FormEvent, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../Constants';

export default function Login() {
    const [formGameId, setFormGameId] = useState<string>("");
    const [formUserId, setFormUserId] = useState<string>("");
    const [formColor, setFormColor] = useState<string>('#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0'));
    const [errorMsg, setErrorMsg] = useState<string>("");

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        axios.get(API_BASE_URL + 'game?game_id=' + formGameId)
            .then((response) => {
                console.log(response);
                if (response.data["Count"] != 0) {
                    localStorage.setItem('gameId', formGameId);
                    localStorage.setItem('userId', formUserId);
                    localStorage.setItem('userColor', formColor);
                    window.location.reload();
                } else {
                    setErrorMsg("Game " + formGameId + " not found.");
                }
            }).catch((error) => {
                console.log("error: " + error);
                setErrorMsg("An unexpected error ocurred.  Please try again.");
            })
    }

    function startGame(event: FormEvent) {
        event.preventDefault();
        axios.post(API_BASE_URL + 'game')
            .then((response) => {
                console.log(response);
                if (response.status === 201) {
                    localStorage.setItem('gameId', response.data["game_id"]);
                    localStorage.setItem('userId', formUserId);
                    localStorage.setItem('userColor', formColor);
                    window.location.reload();
                } else {
                    setErrorMsg("An unexpected error ocurred.  Please try again.");
                }
                
            }).catch((error) => {
                console.log("error: " + error);
                setErrorMsg("An unexpected error ocurred.  Please try again.");
            })
    }

    return (
        <>
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">Join a game</h5>
                {errorMsg !== "" && 
                    <div className="alert alert-danger" role="alert">
                        {errorMsg}
                    </div>
                }
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input type="text" className="form-control" placeholder="Game ID" onChange={(e) => setFormGameId(e.target.value)} required/>    
                    </div>
                    <div className="form-group">
                        <input type="text" value={formUserId} className="form-control" placeholder="Display name" onChange={(e) => setFormUserId(e.target.value)} required/>
                    </div>
                    <div className="row">
                        <div className="col-8">
                            <label htmlFor="newColorPicker" className="form-label">Pick your color</label>
                        </div>
                        <div className="col-4">
                            <input type="color" value={formColor} className="form-control form-control-color" title="Choose your color" id="newColorPicker" onChange={(e) => setFormColor(e.target.value)} required/>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary find-game-btn">Find game</button>              
                </form>
                <h5>Or...</h5>
                <form onSubmit={startGame}>
                    <div className="form-group">
                        <input type="text" value={formUserId} className="form-control" placeholder="Display name" onChange={(e) => setFormUserId(e.target.value)} required />
                    </div>
                    <div className="row">
                        <div className="col-8">
                            <label htmlFor="newColorPicker" className="form-label">Pick your color</label>
                        </div>
                        <div className="col-4">
                            <input type="color" value={formColor} className="form-control form-control-color" title="Choose your color" id="newColorPicker" onChange={(e) => setFormColor(e.target.value)} required/>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary start-game-btn">Start a new game</button>
                </form>
                
            </div>
        </div>
        
        </>
    )
}