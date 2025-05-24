import { expect } from 'chai';

describe('hello-world', () => {
    it('should return "Hello, World!"', () => {
        const helloWorld = () => 'Hello, World!';
        expect(helloWorld()).to.equal('Hello, World!');
    });
});