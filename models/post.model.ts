import { Schema, model, Document } from "mongoose";

const postSchema = new Schema({
    created: {
        type: Date
    },
    mensaje: {
        type: String
    },
    imgs: [{
        type: String
    }],
    coords: {
        type: String
    },
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'Debe existir una referencia a un usuario']
    }, likes: [{
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario'
        }
    }], comments: [{
        text: String,
        postedBy: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario'
        }
    }]

});

postSchema.pre<IPost>('save', function (next) {
    this.created = new Date();
    next();
});

export interface IPost extends Document {
    created: Date,
    mensaje: string,
    imgs: string[],
    coords: string,
    usuario: string,
    likes: any[],
    comments:any[]
}

export const Post = model<IPost>('Post', postSchema)