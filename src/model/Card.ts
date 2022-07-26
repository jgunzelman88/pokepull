
export class Card {
    public guid: string
    public cardId: string
    public idTCGP: string
    public name : string
    public expCodeTCGP?: string
    public expName: string
    public expCardNumber : string
    public rarity: string
    public price?: number
    public releaseDate?: string
    public energyType?: string
    public cardType?: string
    public variant?: string
    public variants? : Array<string>

    constructor(cardId: string, idTCGP: string, name:string, expName:string, expCardNumber:string, rarity:string){
        this.cardId = cardId
        this.idTCGP = idTCGP
        this.name = name
        this.expName = expName
        this.expCardNumber = expCardNumber
        this.rarity = rarity
    }
}

export class Price {
    public date: number
    public cardId: string
    public variant: string
    public grade: number
    public vendor: string
    public price: number

    constructor(date: number, cardId: string, variant: string, vendor: string, price: number){
        this.date = date
        this.cardId = cardId
        this.variant = variant
        this.vendor = vendor
        this.price = price
    }
}

export class CardSearch {
    public total: number = 0
    public cards: Card[] = []
}

export class LinkRequest{
    public type: string
    public card: Card

    constructor(type: string, card: Card){
        this.card = card
        this.type = type
    }
}