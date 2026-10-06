// Frontend transport contract. Checked against the server by check:contracts.
export interface ValidationError {
    rule: string;
    message: string;
}
