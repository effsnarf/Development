abstract class Element
{
    constructor (public game: Game);

    abstract advance(ms: number);
}
