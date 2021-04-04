export class Requisite<T = null> {
    public data: T;
    public result: boolean = false;
    public message: string = "";

    public error(msg: string)
    {
        this.result = false;
        this.message = msg;
        return this;
    }

    public to<V>() {
        return new Requisite<V>().error(this.message);
    }

    public success(data?: T | string)
    {
        if (typeof data === "string") {
            this.message = data;
        }
        else {
            this.data = data;
        }
        this.result = true;
        return this;
    }

    public constructor(data?: T | string)
    {
        this.success(data);
    }

    public toString() {
        return `Requisite(${this.result}): ${this.message}`;
    }
}