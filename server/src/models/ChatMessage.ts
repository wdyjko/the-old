import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class ChatMessage extends Model {
  declare id: number;
  declare orderId: number;
  declare senderId: number;
  declare senderRole: 'elderly' | 'volunteer' | 'admin';
  declare type: 'text' | 'image';
  declare content: string;
  declare readByElderly: boolean;
  declare readByVolunteer: boolean;
}

ChatMessage.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    senderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    senderRole: {
      type: DataTypes.ENUM('elderly', 'volunteer', 'admin'),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('text', 'image'),
      allowNull: false,
      defaultValue: 'text',
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    readByElderly: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    readByVolunteer: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'chat_messages',
    sequelize,
    timestamps: true,
  }
);
