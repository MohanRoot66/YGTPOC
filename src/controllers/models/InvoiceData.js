const { DataTypes } = require("sequelize");

const InvoiceData = (sequelize) => {
    return sequelize.define("InvoiceData", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        supplierName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: true,
            },
        },
        dateReceived: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        bookingRef: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        invNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        invoiceTotal: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        invoiceDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        leadPax: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        documentLink: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ismatched: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        isFinanceMatched: {
            type: DataTypes.BOOLEAN,
            allowNull: true,            
        },
        isSystemGenerated: {
            type: DataTypes.BOOLEAN,
            allowNull: true,            
        },
    }, {
        timestamps: false,  // Disables createdAt and updatedAt fields
    });
};

module.exports = InvoiceData;
