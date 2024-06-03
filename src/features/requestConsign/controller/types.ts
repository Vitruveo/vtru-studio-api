import { ObjectId } from 'mongodb';

export interface RequestConsignProps {
    asset: string | ObjectId;
    creator: string;
    when: Date;
    status: 'pending' | 'approved' | 'rejected';
}
