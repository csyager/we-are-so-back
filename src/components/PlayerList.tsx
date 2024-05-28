import PlayerCoords from "../dao/PlayerCoords";

interface PlayerListProps {
    players: Array<PlayerCoords>
}

export default function PlayerList(props: PlayerListProps) {
    return (
        <div className="list-group mt-3 align-middle">
            {
                props.players.map(function(player: PlayerCoords, i: number){
                    return (
                        <div className="list-group-item text-start player-list-item" key={i}> 
                            <span className="player-list-crosshair">
                                <span style={{color: player.color}}>
                                +
                                </span>
                            </span>
                            <span className="player-list-label align-middle"> {player.player_id}</span>
                        </div>
                    )
                })
            }
        </div>
    );
}