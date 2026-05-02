import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class PointLog extends Model {
  declare id: number;
  declare userId: number;
  declare pointsChanged: number;
  declare reason: string;
  declare orderId: number | null;
}

PointLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    pointsChanged: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    orderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    tableName: 'point_logs',
    sequelize,
    timestamps: true,
  }
);
