export interface RequestConsignProps {
    asset: string;
    creator: string;
    when: Date;
    status: 'pending' | 'approved' | 'rejected';
}
