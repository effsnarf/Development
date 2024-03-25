import "../../Shared/Extensions";

enum TournamentState {
  Lobby,
  Game,
  Finished,
}

interface Player {
  id: number;
}

class Table {
  players: Player[] = [];
}

class Tournament {
  playerCount: number = 10;
  playersPerTable: number = 4;
  players: Player[] = [];
  tables: Table[] = [];
  state: TournamentState = TournamentState.Lobby;

  _mockup = {
    player: {
      id: 1,
      new: () => ({ id: this._mockup.player.id++ }),
    },
  };

  get stateProgressName() {
    switch (this.state) {
      case TournamentState.Game:
        return "started";
      case TournamentState.Finished:
        return "ended";
      default:
        return "not started";
    }
  }

  get stateName() {
    return TournamentState[this.state];
  }

  startGame() {
    if (this.state !== TournamentState.Lobby) {
      throw new Error(`Tournament has already ${this.stateProgressName}`);
    }
    if (this.players.length < this.playerCount) {
      throw new Error(
        `Not enough players to start the game (${this.players.length}/${this.playerCount})`
      );
    }
    this.allocateTables();
    this.state = TournamentState.Game;
  }

  _endGame() {
    this.state = TournamentState.Finished;
  }

  allocateTables() {
    const tableCount = Math.ceil(this.players.length / this.playersPerTable);
    for (let i = 0; i < tableCount; i++) {
      const table = new Table();
      table.players = this.players.slice(
        i * this.playersPerTable,
        (i + 1) * this.playersPerTable
      );
      this.tables.push(table);
    }
  }

  consolidateTables() {}

  eliminatePlayer(player: Player) {
    if (!player) player = this.players.last();
    if (this.state !== TournamentState.Game) {
      throw new Error("Tournament is not in progress");
    }
    if (!this._hasPlayer(player)) {
      throw new Error("Player not in tournament");
    }
    this._removePlayer(player);
    if (this.players.length === 1) {
      this._endGame();
      return;
    }
    this.consolidateTables();
  }

  addPlayer(player: Player) {
    if (!player) player = this._mockup.player.new();
    if (this.players.length >= this.playerCount) {
      throw new Error("Tournament is full");
    }
    if (this.state !== TournamentState.Lobby) {
      throw new Error(`Tournament has already ${this.stateProgressName}`);
    }
    if (this._hasPlayer(player))
      throw new Error("Player already in tournament");
    this.players.push(player);
  }

  _removePlayer(player: Player) {
    this.players = this.players.filter((p) => p.id !== player.id);
    // Remove player from tables
    this.tables.forEach((table) => {
      table.players = table.players.filter((p) => p.id !== player.id);
    });
  }

  addAllPlayers() {
    while (!this.isFull()) this.addPlayer(this._mockup.player.new());
  }

  _hasPlayer(player: Player) {
    return !!this.players.find((p) => p.id === player.id);
  }

  isFull() {
    return this.players.length >= this.playerCount;
  }
}

export { Tournament };
