package vn.edu.vju.lms.dao.impl;

import org.springframework.stereotype.Repository;
import vn.edu.vju.lms.common.dao.HibernateGenericDao;
import vn.edu.vju.lms.dao.IResourceItemDao;
import vn.edu.vju.lms.entity.ResourceItem;

@Repository
public class ResourceItemDaoImpl extends HibernateGenericDao<String, ResourceItem> implements IResourceItemDao {

    public ResourceItemDaoImpl() {
        super(ResourceItem.class);
    }
}
