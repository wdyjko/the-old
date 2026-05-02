import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Order extends Model {
  declare id: number;
  declare title: string;
  declare category: string; // 代购物品、上门维修、陪同就医、生活照料
  declare description: string;
  declare address: string;
  declare expectedTime: Date;
  declare status: 'under_review' | 'pending' | 'accepted' | 'in_progress' | 'submitted' | 'completed' | 'cancelled' | 'rejected' | 'expired';
  declare elderlyId: number;
  declare volunteerId: number | null;
  declare photos: string; // JSON string of photo URLs
  declare rating: number; // 1-5
  declare comment: string;
  declare pointsReward: number | null;
  declare completionPhotos: string | null; // JSON string of photo URLs provided by volunteer
  declare completionDescription: string | null; // Description provided by volunteer during submission
  declare completionRejectionReason: string | null; // Reason provided when a completion submission is rejected
  declare createdAt: Date;
  declare updatedAt: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    // We can add geom location here for spatial queries later
    lat: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    expectedTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('under_review', 'pending', 'accepted', 'in_progress', 'submitted', 'completed', 'cancelled', 'rejected', 'expired'),
      defaultValue: 'under_review',
    },
    elderlyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    volunteerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    photos: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pointsReward: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    completionPhotos: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    completionDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    completionRejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'orders',
    sequelize,
    timestamps: true,
  }
);
